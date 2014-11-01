var serialport = require('serialport');
var Color = require('color');

var SerialPort = serialport.SerialPort;

var isArduino = /arduino/gi;

var Arduino = function(comName) {
	this.comName = comName;
	this.color = Color();
	this.serial = null;
};

Arduino.prototype.connect = function(callback, options) {
	if(this.isConnected()) {
		callback();
		return;
	}

	this.serial = new SerialPort(this.comName, options, false);
	
	this.serial.open(function(err) {
		if(err) {
			this.serial = null;
		}
		else {
			this.serial.on('close', function() {
				this.serial = null;
			}.bind(this)).on('error', function() {
				this.serial = null;
			}.bind(this));
		}

		if(callback) {
			callback(err);
		}
	}.bind(this));
};

Arduino.prototype.disconnect = function(callback) {
	if(this.isConnected()) {
		if(callback) {
			this.serial.close(callback);
		}
		else {
			this.serial.close();
		}
	}
	else if(callback) {
		callback();
	}
};

Arduino.prototype.isConnected = function() {
	return this.serial !== null;
};

Arduino.prototype.setColor = function(color, callback) {
	this.connect(function(err) {
		if(err) {
			if(callback) {
				callback(err);
			}

			return;
		}

		this.color = new Color(color);

		this.serial.write(this.color.hexString() + '\r', function(err) {
			if(err) {
				if(callback) {
					callback(err);
				}

				return;
			}

			if(callback) {
				this.serial.drain(callback);
			}
		}.bind(this));
	}.bind(this));
};

Arduino.prototype.getColor = function() {
	return this.color;
};

Arduino.prototype.toString = Arduino.prototype.getName = function() {
	return this.comName;
};

module.exports = function(callback) {
	serialport.list(function(err, ports) {
		if(err) {
			callback(err);
		}

		var arduinos = [];
		var notArduinos = [];

		ports.forEach(function(port) {
			if(isArduino.test(port.manufacturer)) {
				arduinos.push(new Arduino(port.comName));
			}
			else {
				notArduinos.push(new Arduino(port.comName));
			}
		});

		callback(null, 
			arduinos.length > 0 ? arduinos : null, 
			notArduinos.length > 0 ? notArduinos : null);
	});
};
