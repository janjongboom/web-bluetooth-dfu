const Dfu = require('../index').dfu;
const hex2bin = require('../index').hex2bin;
const fs = require('fs');
const promisify = require('es6-promisify');
const EventEmitter = require('events');

let log = console.log.bind(console, '\x1b[35m[DFUService]\x1b[0m');

(async function () {
    function getAddress(id) {
        return new Uint8Array(id.split(':').map(n => parseInt(n, 16)));
    }

    let ee = new EventEmitter();
    let dfu = new Dfu(ee);
    dfu.addLogger(log);

    try {
        let device = await dfu.findDevice({ name: 'DeviceLinkTest' });
        console.log('Found device', device.id);

        // put the device into DFU mode
        await dfu.writeMode(device);
        console.log('Device is in DFU mode');

        let dfuDevice = await dfu.findDevice({ name: 'DfuTarg'});
        console.log('Found DfuTarget', dfuDevice.id);

        // check last octet...
        if (getAddress(device.id)[5] + 1 !== getAddress(dfuDevice.id)[5]) {
            throw 'Address mismatch. Expected last octet to be ' + (getAddress(device.id)[5] + 1).toString(16) +
                ', but was ' + getAddress(dfuDevice.id)[5];
        }

        let fileName = '/Users/janjon01/repos/cloud-bluetooth-devicelink/firmware/ble-devicelink-example-NRF52_DK_OTA.hex';
        let file = await promisify(fs.readFile.bind(fs))(fileName);
        let hex = file.toString();
        let buffer = hex2bin.convert(hex);

        ee.on('provision-progress', progress => {
            console.log((progress * 100 | 0) + '% done');
        });

        console.log('starting firmware update');
        await dfu.provision(dfuDevice, buffer);
        console.log('firmware update finished');

    }
    catch (ex) {
        console.error('Could not apply DFU', ex);
    }

})();


// var dfu = new Dfu();

// dfu.addLogger(log);
// hex2bin.addLogger(log);

// var fileMask = "";
// var fileName = null;

// var deviceType = process.argv[2];
// if (!deviceType) {
//     deviceType = "nrf51";
//     log("no device-type specified, defaulting to " + deviceType);
// }

// switch (deviceType) {
//     case "nrf51":
//         fileMask = "/Users/janjon01/repos/cloud-bluetooth-devicelink/firmware/ble-devicelink-example-NRF51_DK_OTA.hex";
//         break;
//     case "nrf52":
//         fileMask = "/Users/janjon01/repos/cloud-bluetooth-devicelink/firmware/ble-devicelink-example-NRF52_DK_OTA.hex";
//         break;
//     default:
//         log("unknown device-type: " + deviceType);
//         process.exit();
// }

// (async function () {

// })();

// dfu.findDevice({  })
//     .then(device => {
//         fileName = fileMask; // fileMask.replace("{0}", device.name === "Hi_Rob" ? "bye" : "hi");
//         log("found device: " + device.name, device.address, device.id);
//         log("using file name: " + fileName);

//         // return Promise.reject('whuu');
//         return dfu.writeMode(device);
//     })
//     .then(() => {
//         console.log('wrote to device')
//         return dfu.findDevice({ name: "DfuTarg" });
//     })
//     .then(device => {
//         console.log('device is in dfu mode...', device.name, device.id);
//         var file = fs.readFileSync(fileName);
//         var hex = file.toString();
//         var buffer = hex2bin.convert(hex);
//         log("file length: " + buffer.byteLength);

//         return dfu.provision(device, buffer);
//     })
//     .then(() => process.exit())
//     .catch(error => {
//         log(error);
//         process.exit();
//     });
