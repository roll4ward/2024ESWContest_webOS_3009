/**
 * 서비스와 메소드에 매칭되는 URL을 생성
 * @param {*} service 
 * @param {*} method 
 * @returns 서비스의 URL
 */
const getServiceURL = (service, method) => `luna://xyz.rollforward.app.${service}/${method}`;
console.log(typeof WebOSServiceBridge);
if (typeof WebOSServiceBridge === "undefined") {
    globalThis.WebOSServiceBridge = function() {
        this.onservicecallback = function(){};
        this.call = (service, params) => {
            console.log(`Service ${service} is called : ${params}`);
        }
    }
}
/**
 * 해당 기기의 모든 측정값을 읽어옴
 * @param {string} deviceID 값을 조회할 기기의 ID
 * @param {*} callback 쿼리한 결과를 처리할 콜백 함수
 */
export function readAllValues(deviceID, callback) {
    let bridge = new WebOSServiceBridge();
    bridge.onservicecallback = (msg) => {
        msg = JSON.parse(msg);
        if(!msg.returnValue) {
            console.log(`Service call failed : ${msg.results}`);
            return;
        }

        if(callback) callback(msg.results);
        console.log("Callback called ", callback);
    }

    let query = {
        deviceId: deviceID
    };

    bridge.call(getServiceURL("coap", "read"), JSON.stringify(query));
}

/**
 * 해당 기기의 최근 몇시간의 데이터를 모두 불러옴
 * @param {string} deviceID 값을 조회할 기기의 ID
 * @param {number} hour 조회할 시간
 * @param {*} callback 쿼리한 결과를 처리할 콜백 함수
 */
export function readRecentValues(deviceID, hour, callback) {
    let bridge = new WebOSServiceBridge();
    bridge.onservicecallback = (msg) => {
        msg = JSON.parse(msg);
        if(!msg.returnValue) {
            console.log(`Service call failed : ${msg.results}`);
            return;
        }

        if(callback) callback(msg.results);
        console.log("Callback called ", callback);
    }

    let query = {
        deviceId: deviceID,
        hour: hour
    };

    bridge.call(getServiceURL("coap", "read/recent"), JSON.stringify(query));
}

/**
 * 해당 기기의 가장 최근 측정값을 읽어옴
 * @param {*} deviceID 
 * @param {*} callback 
 */
export function readLatestValue(deviceID, callback) {
    let bridge = new WebOSServiceBridge();
    bridge.onservicecallback = (msg) => {
        msg = JSON.parse(msg);
        if(!msg.returnValue || !msg.results) {
            console.log(`Service call failed : ${msg.results}`);
            return;
        }

        if(callback) callback(msg.results);
        console.log("Callback called ", callback);
    }

    let query = {
        deviceId: deviceID
    };

    bridge.call(getServiceURL("coap", "read/latest"), JSON.stringify(query));
}

/**
 * 해당 기기에 값을 전송함
 * @param {string} deviceID 
 * @param {*} callback 
 * @param {number} value
 */
export function sendValue(deviceID, value, callback) {
    let bridge = new WebOSServiceBridge();
    bridge.onservicecallback = (msg) => {
        msg = JSON.parse(msg);
        if(!msg.returnValue) {
            console.log(`Service call failed : ${msg.results}`);
            return;
        }

        if(callback) callback(msg.results);
        console.log("Callback called ", callback);
    }

    let query = {
        deviceId: deviceID,
        payload: value
    };

    bridge.call(getServiceURL("coap", "send"), JSON.stringify(query));
}

/**
 * 주기적인 CoAP 요청 시작
 * @param {number} interval 주기 (is seconds) 
 * @param {*} callback 
 */
export function startSending(interval, callback) {
    let bridge = new WebOSServiceBridge();
    bridge.onservicecallback = (msg) => {
        msg = JSON.parse(msg);
        if(!msg.returnValue) {
            console.log(`Service call failed : ${msg.results}`);
            if (callback) callback(false);
            return;
        }

        if(callback) callback(true);
        console.log("Callback called ", callback);
    }

    let query = {
        interval: interval
    };

    bridge.call(getServiceURL("coap", "startSending"), JSON.stringify(query));
}