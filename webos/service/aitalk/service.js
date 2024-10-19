const pkg_info = require("./package.json");
const config = require("./config.json")
const fs = require("fs");
const { exec } = require("child_process");

const { aitalk_response, api_ask_parameters, error } = require("./dto");
const CONVESKIND =  "xyz.rollforward.app.aitalk:1";
// API URL의 Protocl에 따라 다른 모듈 import
const http = config.api_url.startsWith("https") ? require("https") : require("http");

const Service = require("webos-service");
const OpenAI = require("openai");
const path = require("path");
const Events = require("events");
const csvWriter = require('csv-writer').createObjectCsvStringifier;

const openai = new OpenAI({apiKey: config.openai_api_key});

var thread = null;

const aitalk_service = new Service(pkg_info.name);



class AITalkEventHandler extends Events.EventEmitter {
  constructor(client, msg) {
    super();
    this.msg = msg;
    this.client = client;
    this.snapshot = "";
  }

  async onEvent(event) {
    console.log(event)

    try {
      console.log(event.event);
      // Retrieve events that are denoted with 'requires_action'
      // since these will have our tool_calls
      if (event.event === "thread.run.requires_action") {
        await this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id,
        );
        
      } else if (event.event === "thread.message.delta") {
          this.snapshot += event.data.delta.content[0].text.value;
          console.log(this.snapshot)
          this.msg.respond(new aitalk_response({
              chunks: this.snapshot.replace(/【\d+:\d+†[^】]+】/g, ""),
              isStreaming: true
          }))
      } else if (event.event === "thread.run.completed") {
          this.snapshot = "";
          this.msg.respond(new aitalk_response({
              chunks: "",
              isStreaming: false
          }))
          this.msg.cancel();
      }
    } catch (e) {
      this.msg.respond(new error("Error handling event:"))
      console.error("Error handling event:", e);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
      try {
          const toolOutputs = 
              await Promise.all(data.required_action.submit_tool_outputs.tool_calls.map(async (toolCall) => {
                  if (toolCall.function.name === "getAreaList") {
                    this.msg.respond(new aitalk_response({
                      chunks: "등록하신 Area의 정보를 읽고 있습니다.. 잠시만 기다려주세요.",
                      isStreaming: true
                    }));

                    const response = await getAreaList(aitalk_service)
                    console.log("response", response)
                    const payload = {
                      tool_call_id: toolCall.id,
                      output: JSON.stringify(response)
                    }
                    console.log("toolCall: ", toolCall)
                    console.log("payload: ", payload)
                    return payload 
                  } 
                  else if (toolCall.function.name === "getDeviceList") {
                    this.msg.respond(new aitalk_response({
                      chunks: "Area 정보를 바탕으로 Devices 의 정보를 읽고 있습니다.. 잠시만 기다려주세요.",
                      isStreaming: true
                    }));
                    
                    const areaId = JSON.parse(toolCall.function.arguments).areaId
                    console.log("toolCall.function", toolCall.function)

                    const response = await getDeviceList(areaId, aitalk_service)
                    console.log("response", response)
                    const payload = {
                      tool_call_id: toolCall.id,
                      output: JSON.stringify(response)
                    }
                    console.log("toolCall: ", toolCall)
                    console.log("payload: ", payload)
                    return payload 
                  }
                  else if (toolCall.function.name === "controlDevices") {
                    this.msg.respond(new aitalk_response({
                      chunks: "Device를 제어하고 있습니다.",
                      isStreaming: true
                    }));

                    console.log("controlDevive invoked")
                    console.log("toolCall, ", toolCall.function.name)

                    const args = JSON.parse(toolCall.function.arguments)
                    console.log("controlDevice args: ", args)
                    const response = await controlDevices(args.deviceId, args.level, aitalk_service)
                    const payload = {
                      tool_call_id: toolCall.id,
                      output: JSON.stringify(response)
                    }
                    console.log("payload: ", payload)
                    return payload 
                  }
                  else if (toolCall.function.name === "getSensorValuesOfAreaByTimeAsCSV") {
                    console.log("getSensorValuesOfAreaByTimeAsCSV invoked")
                    console.log("toolCall, ", toolCall.function.name)

                    const args = JSON.parse(toolCall.function.arguments)
                    console.log("controlDevice args: ", args)
                    const response = await getSensorValuesOfAreaByTimeAsCSV(args.areaId, args.NHoursAgo, aitalk_service)
                    const payload = {
                      tool_call_id: toolCall.id,
                      output: JSON.stringify(response)
                    }
                    console.log("payload: ", payload)
                    return payload 
                  }
                  else {
                      return {
                          tool_call_id: toolCall.id, 
                          output: JSON.stringify({success: false})
                      };
                  }
              }));
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (err) {
      this.msg.respond(new error("Error processing required action:", err))
      console.error("Error processing required action:", err);
      return {
          tool_call_id: toolCall.id, 
          output: JSON.stringify({success: false, error: err})
      };
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs },
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}

aitalk_service.register("ask_stream", async function(msg) {
  const aitalkEventHandler = new AITalkEventHandler(openai, msg);
  aitalkEventHandler.on("event", aitalkEventHandler.onEvent.bind(aitalkEventHandler));

  if (!thread) {
    thread = await openai.beta.threads.create();    
  };

  console.log(msg)
  if (!msg.payload.prompt) {
    msg.respond(new error('prompt is required.'));
    return;
  }

  // build contents for "ask"
  let contents = [];
  contents.push({"type": "text", "text": msg.payload.prompt});

  if (msg.payload.imagePaths) {
    const uploadPromises = msg.payload.imagePaths.map(async (image_path) => {
      const img_file = await openai.files.create({
        file: fs.createReadStream(image_path),
        purpose: "assistants"
      });
      console.log("img_file: ", img_file);
      contents.push({ "type": "image_file", "image_file": { "file_id": img_file.id } });
    });
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
  }

  console.log("content: ", contents)
  const threadMessages = await openai.beta.threads.messages.create(thread.id, { role: "user", content: contents});
  const stream = await openai.beta.threads.runs.stream(
    thread.id,
    { assistant_id: config.openai_assistant_id },
    aitalkEventHandler,
  );

  for await (const event of stream) {
    aitalkEventHandler.emit("event", event);
  }
});

aitalk_service.register("stt", async function(msg) {
  // 0. check msg contains "voice_path"
  console.log(msg.payload.voice_path);
  if (!("voice_path" in msg.payload)) {
    console.log('It requires voice_path (e.g. voice_text.mp3).');
    msg.respond(new error('It requires voice_path (e.g. voice_text.mp3).'));
    return;
  }

  // 1. check is voice file (e.g. mp3) is exist
  // 1.1. if doesn't exist, then raise RuntimeError
  if (!fs.existsSync(msg.payload.voice_path)) {
    console.log("File not found. ");
    msg.respond(new error("File not found. ", msg.payload.voice_path))
    return;
  }

  // 2. send voice file to API servce
  const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(msg.payload.voice_path),
      model: config.openai_stt_model,
  });

  // 3. return text converted from voice file
  const voice_prompt = transcription.text;
  msg.respond(new aitalk_response(
    {voice_prompt: voice_prompt}
  ))

  // 다 사용한 파일 삭제 추가 -geonha
  fs.readdir("/media/internal", (err, files) => {
    if (err) {
      console.error('Directory reading error:', err);
      return;
    }

    // 파일들 중에서 "audio"로 시작하는 파일들 필터링
    const audioFiles = files.filter(file => file.startsWith('Audio'));

    // 필터된 파일들을 삭제
    audioFiles.forEach(file => {
      const filePath = path.join("/media/internal", file);
      fs.unlink(filePath, err => {
        if (err) {
          console.error(`Error deleting file ${file}:`, err);
        } else {
          console.log(`Successfully deleted ${file}`);
        }
      });
    });
  });
});

aitalk_service.register("tts", async function (msg) {
  // 0. check msg contains "tts"

  console.log(msg);

  if (!("text" in msg.payload)) {
    msg.respond(new error('It requires text (e.g. {text: "Hello world"}).'));
    return;
  }

  const mp3 = await openai.audio.speech.create({
    model: config.openai_tts.model,
    voice: config.openai_tts.voice,
    input: msg.payload.text,
    response_format: "pcm",
    speed: 1.2
  });

  const tts_path = path.resolve(__dirname, "./tts.pcm");
  console.log("audio file will be stored to " + tts_path);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(tts_path, buffer);
  console.log("TTS done.");

  exec("python3 ./audioCon.py " + "./tts.pcm" + " 24000 " + "./tts.pcm" + " 32000",(err, stdout, stderr) => {
      if (err) {
        console.error(`Error during conversion: ${stderr}`);
      } else {
        msg.respond(new aitalk_response({ store_path: tts_path}));
      }
    }
  );
});

// 세션 & 대화 정보 데이터베이스 생성 (임시)
aitalk_service.register('createKind', function (message) {
  const kindData = {
    id: CONVESKIND,
    owner: 'xyz.rollforward.app.aitalk',
    schema: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            type: { type: 'string' },
            text: { type: 'string' },
            image: { type: 'string' },
            regdate: { type: 'string' }
        },
        required: ['type', 'text', 'regdate']
    },
    indexes: [
        { name: 'type', props: [{ name: 'type' }] },
        { name: 'text', props: [{ name: 'text' }] },
        { name: 'regdate', props: [{ name: 'regdate' }] }
    ]
  };

  aitalk_service.call('luna://com.webos.service.db/putKind', kindData, (response) => {
      if (response.payload.returnValue) {
          message.respond({ returnValue: true });
      } else {
          message.respond({ returnValue: false, result: response.error });
      }
  });
});

// 세션 & 대화 데이터베이스 삭제 (임시)
aitalk_service.register('deleteKind', function(message) {
    aitalk_service.call('luna://com.webos.service.db/delKind', { id: CONVESKIND }, (response) => {
        if (response.payload.returnValue) {
          message.respond({ returnValue: true });
        } else {
            message.respond({ returnValue: false, result: response.error });
        }
    });
});

// 세션 데이터 Create
aitalk_service.register('create', function(message) {
  const dataToStore = {
      _kind: CONVESKIND,
      text: message.payload.text,
      type: message.payload.type,
      image: JSON.stringify(message.payload.image),
      regdate: new Date().toISOString()
  };

  if (!dataToStore.type || !dataToStore.text) {
      return message.respond({ returnValue: false, result: 'text, type fields are required.' });
  }

  aitalk_service.call('luna://com.webos.service.db/put', { objects: [dataToStore] }, (response) => {
      console.log(response);
      if (response.payload.returnValue) {
          message.respond({ returnValue: true, result: response.payload.results[0].id});
      } else {
          message.respond({ returnValue: false, result: response.error});
      }
  });
});

// 세션 데이터 Read
aitalk_service.register('read', function(message) {
  const query  = {
      from: CONVESKIND,
      where: [],
      select: ["type", "text", "image"],
      limit: 10,
      desc: true
  };

  if(message.payload.page) query.page = message.payload.page
  
  aitalk_service.call('luna://com.webos.service.db/find', { query: query }, (response) => {
    if(response.payload.returnValue){
      if (response.payload.results.length > 0) {
          message.respond({ returnValue: true, result: {texts:response.payload.results.reverse(), page:response.payload.next}});
      } else {
          message.respond({ returnValue: true, result: {texts:[], page:null} });
      }
    }else{
        message.respond({ returnValue: false, result: 'cannot found conversation' });
    }
  });
});

/////////////////////////////////// Control functions ////////////////////////////////////

// getAreaList() => [Area0, Area1, ...]
// 입력은 인자는 없고 Area에 대한 정보를 
// xyz.rollforward.app.infomanage/area/read 서비스를 활용하여 그대로 return 
function getAreaList(service) 
{
  console.log("getAreaList is invoked")
  return new Promise((resolve, reject) => {
    service.call("luna://xyz.rollforward.app.infomanage/area/read", {}, (response) => {
      if (response.payload.returnValue) {
        console.log(response.payload)
        resolve({success: true, response: response.payload})
      } else {
        reject({success: false})
      }
    })
  })
}

// getDeviceList([AreaIds]) => [Device0, Device1, ...]
// xyz.rollforward.app.infomanage/device/read 서비스를 활용하여 
// AreaIds 속한 AreaId를 갖는 device들만 return (파싱이 필요) 
function getDeviceList(areaId, service) 
{
  console.log("getDeviceList is invoked")
  const query = {
    select: ["_id", "areaId", "name", "type", "desc"],
    areaId: areaId
  }
  console.log("query: ", query)
  return new Promise((resolve, reject) => {
    service.call("luna://xyz.rollforward.app.infomanage/device/read", query, (response) => {
      console.log("getDeviceList response: ", response)
      if (response.payload.returnValue) {
        resolve({success: true, response: response.payload})
      } else {
        reject({success: false})
      }
    })
  });
}; 

// controlDevice(deviceId, level: 0-100(int))
// deviceId 를 사용하여 actuator를 0부터 100 사이의 값을 갖도록 조작함.
function controlDevices(deviceId, level, service) 
{
  console.log("controlDevice is invoked")
  const payload = {
    deviceId: deviceId,
    payload: level
  }

  return new Promise((resolve, reject) => {
    service.call("luna://xyz.rollforward.app.coap/send", payload, (response) => {
      if (response.payload.returnValue) {
        console.log(response.payload)
        resolve({success: true, response: response.payload})
      } else {
        console.log("fail: ", response)
        reject({success: false})
      }
    })
  })
}

function getSensorValuesOfAreaByTimeAsCSV(areaId, NHoursAgo, service) 
{
  console.log("getSensorValuesOfAreaByTimeAsCSV is invoked")
  return new Promise((resolve, reject) => {
    // 1. areaId에 속한 device들을 먼저 불러옴
    console.log("getDeviceList is invoked")
    const query = {
      select: ["_id", "areaId", "name", "type", "desc", "subtype"],
      areaId: areaId
    }
    console.log("query: ", query)
    let deviceList = [];
    service.call("luna://xyz.rollforward.app.infomanage/device/read", query, (response) => {
      console.log("getDeviceList response: ", response)
      if (response.payload.returnValue) {

        // 1. deviceId와 subtype을 매핑
        const deviceIdToSensor = {};
        response.payload.results.forEach((device) => {
          const deviceId = device._id;
          const sensorType = device.subtype;
          deviceIdToSensor[deviceId] = sensorType;
        });
        console.log("deviceIdToSensor: ", deviceIdToSensor);

        // 2. 고유한 subtype 목록 추출
        const sensorTypes = Array.from(new Set(Object.values(deviceIdToSensor)));
        console.log("sensorTypes: ", sensorTypes);

        // 2. 불러온 deviceId들의 sensor values를 읽어옴
        let deviceIds = response.payload.results.map(({ _id }) => _id);
        console.log(`deviceIds: ${deviceIds}`);

        aitalk_service.call("luna://xyz.rollforward.app.coap/read", {"deviceIds": deviceIds}, (res) => {
          console.log(`responses: ${res}`)
          // 3. parsing 하고 저장
          const jsonData = res.payload.results;

          // test /////////////////////////////////////////////////////////////////////////////////////////////
          // const jsonData = [
          //   {"time": 1729345031, "deviceId": "NZR5cCINcHs", "value": 3}, // temperature sensor
          //   {"time": 1729345131, "deviceId": "NZR5cCINcHs", "value": 4},
          //   {"time": 1729345231, "deviceId": "NZR5cCINcHs", "value": 2},
          //   {"time": 1729345331, "deviceId": "NZR5cCINcHs", "value": 1},
          //   {"time": 1729345031, "deviceId": "NZR5dO1AKBw", "value": 3}, // humidity sensor
          //   {"time": 1729345131, "deviceId": "NZR5dO1AKBw", "value": 4},
          //   {"time": 1729345231, "deviceId": "NZR5dO1AKBw", "value": 2},
          //   {"time": 1729345331, "deviceId": "NZR5dO1AKBw", "value": 1},
          //   {"time": 1729345031, "deviceId": "NZR5eINqb_k", "value": 3}, // light sensor
          //   {"time": 1729345131, "deviceId": "NZR5eINqb_k", "value": 4},
          //   {"time": 1729345231, "deviceId": "NZR5eINqb_k", "value": 2},
          //   {"time": 1729345331, "deviceId": "NZR5eINqb_k", "value": 1},
          // ]
          // test /////////////////////////////////////////////////////////////////////////////////////////////

          // 시간별로 데이터를 그룹화
          const timeMap = {};

          jsonData.forEach((item) => {
            // Unix 타임스탬프를 ISO 형식으로 변환
            const isoTime = new Date(item.time * 1000).toISOString();
            const sensorType = deviceIdToSensor[item.deviceId];

            if (!timeMap[isoTime]) {
              timeMap[isoTime] = { time: isoTime };
            }
            timeMap[isoTime][sensorType] = item.value;
          });

          // 시간별로 정렬된 레코드 배열 생성
          const records = Object.values(timeMap).sort((a, b) => new Date(a.time) - new Date(b.time));

          // 4. csvHeaders를 동적으로 생성
          const csvHeaders = [
            { id: 'time', title: 'Time' },
            ...sensorTypes.map((sensorType) => ({ id: sensorType, title: sensorType }))
          ];
          console.log("csvHeaders: ", csvHeaders);

          const csvStringifier = csvWriter({
            header: csvHeaders,
          });

          // CSV 문자열 생성
          const headerString = csvStringifier.getHeaderString();
          const recordsString = csvStringifier.stringifyRecords(records);
          const csvOutput = headerString + recordsString;

          // 콘솔에 출력
          console.log(csvOutput);

          resolve({succes: true, sensorValues: csvOutput, isTest: true})
        });
      } else {
        reject({success: false})
      }
    })
    })
}; 