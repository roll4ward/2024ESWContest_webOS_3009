const pkg_info = require("./package.json");
const Service = require('webos-service');
const coap = require('coap');
const { Buffer } = require('node:buffer');
const { Readable } = require('stream');

const service = new Service(pkg_info.name);
const DB_KIND = 'xyz.rollforward.app.coap:1';
let interval = null;
let heartbeat_subscription;
let heartbeat_message = [];
let heartbeat_interval;

// 센서 값 데이터베이스 생성 (임시)
service.register('createKind', function(message) {
    const kindData = {
        id: DB_KIND,
        owner: 'xyz.rollforward.app.coap',
        schema: {
            type: 'object',
            properties: {
                _id: { type: 'string' },
                deviceId: { type: 'string' },
                value: { type: 'number' },
                time: { type: 'number' }
            },
            required: ['deviceId', 'time', 'value']
        },
        indexes: [
            { name: 'deviceId', props: [{ name: 'deviceId' }] },
            { name: 'deviceId_latest', props: [ {name: 'deviceId'}, {name: "_rev"}]},
            { name: 'deviceId_recent', props: [ {name: 'deviceId'}, {name: "time"}]}
        ]
    };

    service.call('luna://com.webos.service.db/putKind', kindData, (response) => {
        if (response.payload.returnValue) {
            message.respond({ returnValue: true, results: 'Kind created successfully'});
        } else {
            message.respond({ returnValue: false, error: response.error });
        }
    });
});

// 센서 값 데이터베이스 삭제 (임시)
service.register('deleteKind', function(message) {
    service.call('luna://com.webos.service.db/delKind', {id: DB_KIND}, (response) => {
        if (response.payload.returnValue) {
            message.respond({ returnValue: true, results: 'Kind deleted successfully'});
        } else {
            message.respond({ returnValue: false, error: response.error });
        }
    });
});

// 센서 값 데이터 Create (임시)
service.register('create', function(message) {
    if (!(message.payload.deviceId && typeof message.payload.value !== 'undefined')) {
        message.respond({
            returnValue: false,
            results: "Value & deviceId is required"
        })
    }
    saveSensorData(service, message.payload.deviceId, message.payload.value);
});

// 센서 값 데이터 Update (임시)
service.register('update', function(message) {
    const updatedItem = {
        _id: message.payload.id,
        _kind: DB_KIND
    };

    if (message.payload.deviceId) {
        updatedItem.deviceId = message.payload.deviceId;
    }

    if (message.payload.value) {
        updatedItem.value = message.payload.value;
    }

    if (message.payload.time) {
        updatedItem.time = message.payload.time;
    }

    service.call('luna://com.webos.service.db/merge', { objects: [updatedItem] }, (response) => {
        console.log(response);
        if (response.payload.returnValue) {
            message.respond({ returnValue: true, results: 'Item updated successfully' });
        } else {
            message.respond({ returnValue: false, results: response.error });
        }
    });
});

// 센서 값 데이터 read
service.register('read', function(message) {
    const query = {
        from: DB_KIND,
        where: []
    };

    if (message.payload.id) {
        query.where.push({ prop: '_id', op: '=', val: message.payload.id });
    }

    if (message.payload.deviceId) {
        query.where.push({ prop: 'deviceId', op: '=', val: message.payload.deviceId });
    }

    service.call('luna://com.webos.service.db/find', { query: query }, (response) => {
        if (response.payload.returnValue) {
            if (message.payload.deviceIds) {
               let select = [];
               response.payload.results.map((res) => {
                if (message.payload.deviceIds.includes(res.deviceId)) {
                    select.push(res)
                }
               }) 

               response.payload.results = select;
            }

            message.respond({ returnValue: true, results: response.payload.results });
        } else {
            message.respond({ returnValue: false, results: response.error });
        }
    });
});

// 가장 최근에 측정된 값 read
service.register('read/recent', function(message) {
    if (!(message.payload.deviceId && message.payload.hour)) {
        message.respond({ returnValue: false, results: "deviceId & hour are required."});
        return;
    }

    const n_hour_ago = Date.now() - message.payload.hour * 60 * 60 * 1000;

    const query = {
        from: DB_KIND,
        where: [
            { prop: 'deviceId', op: '=', val: message.payload.deviceId },
            { prop: 'time', op: '>=', val: n_hour_ago }
        ],
        desc: true
    };

    service.call('luna://com.webos.service.db/find', { query: query }, (response) => {
        console.log(response);
        if (response.payload.returnValue) {
            let result = response.payload.results;

            console.log(result);
            
            message.respond({ returnValue: true, results: result });
        } else {
            message.respond({ returnValue: false, results: response.error });
        }
    });
});

// 가장 최근에 측정된 값 read
service.register('read/latest', function(message) {
    const query = {
        from: DB_KIND,
        where: [{ prop: 'deviceId', op: '=', val: message.payload.deviceId }],
        orderBy: "_rev",
        desc: true,
        limit: 1
    };

    if (!message.payload.deviceId) {
        message.respond({ returnValue: false, results: "deviceId is required."});
    }

    service.call('luna://com.webos.service.db/find', { query: query }, (response) => {
        console.log(response);
        if (response.payload.returnValue) {
            let result = response.payload.results;

            console.log(result);
            
            message.respond({ returnValue: true, results: result[0] });
        } else {
            message.respond({ returnValue: false, results: response.error });
        }
    });
});

// 센서 값 데이터 Delete
service.register('delete', function(message) {
    const ids = [message.payload.id];
    
    if (!("id" in message.payload)) {
        message.respond({ returnValue: false, results: 'id is required.' });
    }

    service.call('luna://com.webos.service.db/del', { ids: ids }, (response) => {
        if (response.payload.returnValue) {
            message.respond({ returnValue: true, results: 'Item deleted successfully' });
        } else {
            message.respond({ returnValue: false, results: response.error });
        }
    });
});

// device에 속한 value 모두 삭제
service.register('delete/device', function(message) {
    if (!("deviceId" in message.payload)) {
        message.respond({ returnValue: false, results: 'deviceId is required.' });
    }

    const query = {
        from: DB_KIND,
        where : [
            {prop : "deviceId", op : "=", val : message.payload.deviceId}
        ]
    }

    service.call('luna://com.webos.service.db/del', { query: query }, (response) => {
        console.log("COAP Device delete ", response.payload);
        if (response.payload.returnValue) {
            message.respond({ returnValue: true, results: 'Item deleted successfully' });
        } else {
            message.respond({ returnValue: false, results: response.error });
        }
    });
});

// CoAP 관련 함수

// 센서 데이터 저장 함수
function saveSensorData(deviceId, value) {
    return new Promise((res, rej) => {
        const dataToStore = {
            _kind: DB_KIND,
            deviceId: deviceId,
            time: Date.now(),
            value: value
        };
    
        service.call('luna://com.webos.service.db/put', { objects: [dataToStore] }, (response) => {
            if (response.payload.returnValue) {
                res();
            } else {
                rej(response.payload.errorText);
            }
        });
    });
}

// CoAP 메시지 전송 및 데이터 저장 함수
function sendCoapMessage(hostIP, method, pathname, payload) {
    return new Promise((res, rej) => {
        let timeout;
        const req = coap.request({
            host: hostIP,
            port: 6000,
            method: method,
            pathname: pathname,
        });
    
        req.on('response', function(response) {
            console.log('Response from CoAP server:', response.payload.toString(), response.payload.readDoubleLE(0));
            res(response.payload.readDoubleLE(0));
            clearTimeout(timeout);
            timeout = null;
        });

        req.on('error', (err) => {
            console.log("Error occured : ", err);
            rej("CoAP ERROR");
            clearTimeout(timeout);
            timeout = null;
        })

        if(typeof payload !== "undefined") {
            const buf = Buffer.allocUnsafe(8);
    
            buf.writeDoubleLE(payload);
            console.log(buf);

            const stream = Readable.from(buf);

            stream.pipe(req);
        }
        else {
            req.end();
        }

        timeout = setTimeout(()=>{
            req.emit("error", "timeout");
        }, 5000);
    });
}

function getDeviceInfo(deviceId) {
    return new Promise((res, rej) => {
        service.call(
            "luna://xyz.rollforward.app.infomanage/device/read",
            { id : deviceId },
            (response) => {
                if (!response.payload.returnValue) {
                    console.error(response.payload.results);
                    rej("failed to get device info");
                    return;
                }
                if (!response.payload.results[0]) {
                    rej("failed to get device info");
                    return;
                }
                console.log(response.payload.results[0]);
                res(response.payload.results[0]);
            }
        );
    });
}

function getAllDeviceInfos() {
    return new Promise((res, rej) => {
        service.call(
            "luna://xyz.rollforward.app.infomanage/device/read",
            { },
            (response) => {
                if (!response.payload.returnValue) {
                    console.error(response.payload.results);
                    rej("failed to get device info");
                    return;
                }
                if (!response.payload.results) {
                    rej("failed to get device info");
                    return;
                }
                console.log(response.payload.results);
                res(response.payload.results);
            }
        );
    });
}

function sendMessageAndSave(deviceInfo, payload) {
    return new Promise(async (res, rej) => { 
        let response_value
        try {
            if (typeof payload !== "undefined") {
                response_value = await sendCoapMessage(deviceInfo.ip, "POST", deviceInfo.subtype, payload);
            }
            else {
                response_value = await sendCoapMessage(deviceInfo.ip, "GET", deviceInfo.subtype);
            }
        }
        catch (err) {
            rej(err);
            console.log("Failed to send data: ", err);
            return;
        }

        try {
            await saveSensorData(deviceInfo._id, response_value);
        }
        catch (err) {
            rej("Failed to save data : ", err);
            console.log("Failed to save data: ", err);
            return;
        }
        console.log("Success : ", response_value);
        res(response_value);
    });
}

service.register("send", (message) => {
    if (!message.payload.deviceId) {
        message.respond({
            returnValue: false,
            results: "deviceId is required"
        });
        return;
    }

    getDeviceInfo(message.payload.deviceId)
    .then((deviceInfo) => {
        sendMessageAndSave(deviceInfo, message.payload.payload)
        .catch((err) => {
                        console.log("Send Coap err in post : ", err);
                    });
    })
    .then((response) => {
        message.respond({
            returnValue: true,
            results : response
        });
    })
    .catch((err) => {
        message.respond({
            returnValue: false,
            results : err
        });
    })
});

// 서비스 메소드: CoAP 메시지 전송 시작
service.register("startSending", (message) => {
    if (!(message.payload.interval)) {
        message.respond({
            returnValue: false,
            results: "interval is required"
        });
    }

    if (!interval) {
        interval = setInterval(() => {
            getAllDeviceInfos()
            .then((deviceInfos) => {
                deviceInfos.forEach((deviceInfo) => {
                    if (deviceInfo.type === "sensor"){
                        sendMessageAndSave(deviceInfo)
                        .catch((err) => {
                            console.log("Send Coap err in interval : ", err);
                        });
                    }
                });
            })
            .catch((reason) => {
                console.log(reason);
            });
        }, message.payload.interval * 1000);

        let sub = service.subscribe("luna://xyz.rollforward.app.coap/heartbeat" , {subscribe: true});

        sub.on("response", (response)=> {
            console.log(response.payload.event);
        });

        heartbeat_subscription = sub;
        console.log(heartbeat_subscription);
        console.log(interval);

        message.respond({
            returnValue: true,
            message: "Started sending CoAP messages and storing data"
        });
    } else {
        message.respond({
            returnValue: false,
            message: "Already sending CoAP messages and storing data"
        });
    }
});

// 서비스 메소드: CoAP 메시지 전송 중지
service.register("stopSending", (message) => {
    if (interval)  {
        clearInterval(interval);
        interval = null;
        heartbeat_subscription.cancel();
        heartbeat_subscription = null;
        message.respond({
            returnValue: true,
            message: "Stopped sending CoAP messages and storing data"
        });
    } else {
        message.respond({
            returnValue: false,
            message: "Not currently sending CoAP messages"
        });
    }
});

service.register("heartbeat",
    (message) => {
        message.respond({
            returnValue: true,
            event: "beat"
        });

        if (message.isSubscription) {
            heartbeat_message[message.uniqueToken] = message;
            console.log(heartbeat_message);
            if (!heartbeat_interval) createHeartbeatInterval();
        }
    },
    (message) => {
        console.log(message);
        delete heartbeat_subscription[message.uniqueToken];
        if (heartbeat_subscription.length === 0) {
            clearInterval(heartbeat_interval);
            heartbeat_interval = null;
        }
    });

function createHeartbeatInterval() {
    if (heartbeat_interval) {
        return;
    }
    
    heartbeat_interval = setInterval(()=>{
        sendResponseToSubscribers();
    }, 1000);
}

function sendResponseToSubscribers() {
    heartbeat_message.forEach((message) => {
        message.respond({
            returnValue: true,
            event: "beat"
        });
    });
}