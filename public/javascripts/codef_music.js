/*------------------------------------------------------------------------------
Copyright (c) 2011 Antoine Santo Aka NoNameNo

This File is part of the CODEF project.

More info : http://codef.santo.fr
Demo gallery http://www.wab.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
------------------------------------------------------------------------------*/
function music(a) {
	if (typeof webkitAudioContext != "undefined") {
		switch (a) {
		case "YM":
			CODEF_AUDIO_CONTEXT = new webkitAudioContext;
			CODEF_AUDIO_NODE = CODEF_AUDIO_CONTEXT.createJavaScriptNode(8192);
			this.loader = new Object;
			this.loader["player"] = new YmProcessor;
			this.stereo_value = false;
			break;
		default:
			this.stereo_value = false;
			break
		}
	}
	if (a == "YM") {
		this.LoadAndRun = function(a) {
			var b = this;
			if (typeof webkitAudioContext != "undefined") {
				var c = new XMLHttpRequest;
				c.open("GET", a);
				c.overrideMimeType("text/plain; charset=x-user-defined");
				c.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						var a = this.responseText || "";
						var c = [];
						var d = a.length;
						var e = String.fromCharCode;
						for ( var f = 0; f < d; f++) {
							c[f] = e(a.charCodeAt(f) & 255)
						}
						var g = new dataType;
						g.data = c.join("");
						YmConst_PLAYER_FREQ = CODEF_AUDIO_CONTEXT.sampleRate;
						b.loader.player.stereo = b.stereo_value;
						b.loader.player.load(g)
					}
				};
				c.send()
			}
		}
	} else {
		this.LoadAndRun = function(a) {
			var b = this;
			this.loader = window.neoart.FileLoader;
			if (typeof webkitAudioContext != "undefined") {
				var c = new XMLHttpRequest;
				c.open("GET", a);
				c.overrideMimeType("text/plain; charset=x-user-defined");
				c.responseType = "arraybuffer";
				c.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						b.loader.player = null;
						b.loader.load(this.response);
						b.loader.player.reset();
						b.loader.player.stereo = b.stereo_value;
						b.loader.player.play()
					}
				};
				c.send()
			}
		}
	}
	
	this.stereo = function(a) {
		this.stereo_value = a
	};
	return this
}
function YmSong(a) {
	this.title;
	this.author;
	this.comment;
	this.attribs;
	this.clock;
	this.digidrums;
	this.drums;
	this.frames = new Array;
	this.frameSize;
	this.length;
	this.rate;
	this.restart;
	this.supported = true;
	this.data = new dataType;
	this.data.data = a;
	this.init = function() {
		this.decode();
		if (this.attribs & YmConst_INTERLEAVED)
			this.deinterleave();
		for (i = 0; i < this.length; ++i) {
			this.frames[i] = this.data.readBytes(0, this.frameSize)
		}
	};
	this.decode = function() {
		var a;
		var b;
		var c = this.data.readMultiByte(4, "txt");
		switch (c) {
		case "YM2!":
		case "YM3!":
		case "YM3b":
			this.frameSize = 14;
			this.length = (this.data.data.length - 4) / this.frameSize;
			this.clock = YmConst_ATARI_FREQ;
			this.rate = 50;
			this.restart = c != "YM3b" ? 0 : this.data.readByte();
			this.attribs = YmConst_INTERLEAVED | YmConst_TIME_CONTROL;
			break;
		case "YM4!":
			this.supported = false;
			break;
		case "YM5!":
		case "YM6!":
			c = this.data.readMultiByte(8, "txt");
			if (c != "LeOnArD!") {
				this.supported = false;
				return
			}
			this.length = this.data.readInt();
			this.attribs = this.data.readInt();
			this.drums = this.data.readShort();
			this.clock = this.data.readInt();
			this.rate = this.data.readShort();
			this.restart = this.data.readInt();
			this.data.readShort();
			if (this.drums) {
				this.digidrums = new Array;
				for (b = 0; b < this.drums; ++b) {
					this.digidrum = new Digidrum(this.data.readInt());
					if (this.digidrum.size != 0) {
						this.digidrum.wave.data = this.data.readBytes(0,
								this.digidrum.size);
						this.digidrum.convert(this.attribs);
						this.digidrums[b] = this.digidrum
					}
				}
				this.attribs &= ~YmConst_DRUM_4BITS
			}
			this.title = this.data.readString();
			this.author = this.data.readString();
			this.comment = this.data.readString();
			this.frameSize = 16;
			this.attribs = YmConst_INTERLEAVED | YmConst_TIME_CONTROL;
			break;
		case "MIX1":
			supported = false;
			break;
		case "YMT1":
		case "YMT2":
			supported = false;
			break;
		default:
			supported = false;
			break
		}
	};
	this.deinterleave = function() {
		var a;
		var b;
		var c = 0;
		var d = new Array;
		var e = new Array;
		for (a = 0; a < this.frameSize; ++a)
			d[a] = this.data.pos + this.length * a;
		for (a = 0; a < this.length; ++a) {
			for (b = 0; b < this.frameSize; ++b)
				e[b + c] = this.data.data[a + d[b]];
			c += this.frameSize
		}
		this.data.data = "";
		this.data.data = e;
		this.data.pos = 0;
		this.attribs &= ~YmConst_INTERLEAVED
	};
	this.init()
}
function YmProcessor() {
	this.counter;
	this.sound;
	this.soundChannel;
	this.soundChannelPos;
	this.song;
	this.loop = 1;
	this.stereo = 0;
	this.audioFreq;
	this.clock;
	this.registers = new Array;
	this.volumeEnv;
	this.buffer;
	this.bufferSize;
	this.voiceA = new YmChannel(this);
	this.voiceB = new YmChannel(this);
	this.voiceC = new YmChannel(this);
	this.samplesTick;
	this.samplesLeft;
	this.frame;
	this.envData;
	this.envPhase;
	this.envPos;
	this.envShape;
	this.envStep;
	this.noiseOutput;
	this.noisePos;
	this.noiseStep;
	this.rng;
	this.syncBuzzer;
	this.syncBuzzerPhase;
	this.syncBuzzerStep;
	__self = this;
	this.init = function() {
		var a;
		this.bufferSize = YmConst_BUFFER_SIZE;
		this.buffer = new Array;
		for (a = 0; a < this.bufferSize; ++a)
			this.buffer[a] = new Sample;
		this.envData = YmConst_ENVELOPES
	};
	this.load = function(a) {
		var b = new LHa;
		this.song = new YmSong(b.unpack(a));
		this.audioFreq = YmConst_PLAYER_FREQ;
		this.clock = this.song.clock;
		this.samplesTick = this.audioFreq / this.song.rate;
		CODEF_AUDIO_NODE.onaudioprocess = function(a) {
			__self.mixer(a)
		};
		return this.song.supported
	};
	this.mixer = function(a) {
		var b = 0;
		var c = 0;
		var d = 0;
		var e = 0;
		var f;
		var g = 0;
		var h = 0;
		var i = 0;
		while (d < this.bufferSize) {
			if (this.samplesLeft == 0) {
				if (this.frame >= this.song.length) {
					if (this.loop) {
						this.frame = this.song.restart
					} else {
						this.stop();
						return
					}
				}
				this.syncBuzzerStop();
				for (c = 0; c < this.song.frameSize; c++) {
					this.registers[c] = this.song.frames[this.frame][c]
							.charCodeAt(0)
				}
				this.frame++;
				this.updateEffects(1, 6, 14);
				this.updateEffects(3, 8, 15);
				this.writeRegisters();
				this.samplesLeft = this.samplesTick
			}
			h = this.samplesLeft;
			if (d + h > this.bufferSize)
				h = this.bufferSize - d;
			g = e + h;
			for (c = e; c < g; ++c) {
				f = this.buffer[c];
				if (this.noisePos & 65536) {
					b = this.rng & 1 ^ this.rng >> 2 & 1;
					this.rng = this.rng >> 1 | b << 16;
					this.noiseOutput ^= b ? 0 : 65535;
					this.noisePos &= 65535
				}
				this.volumeEnv = this.envData[Math.floor((this.envShape << 6)
						+ (this.envPhase << 5) + (this.envPos >> 26))];
				this.voiceA.computeVolume();
				this.voiceB.computeVolume();
				this.voiceC.computeVolume();
				b = this.voiceA.enabled()
						& (this.noiseOutput | this.voiceA.mixNoise);
				var j = this.voiceA.getvolume();
				f.voiceA = b ? this.voiceA.getvolume() : -1;
				b = this.voiceB.enabled()
						& (this.noiseOutput | this.voiceB.mixNoise);
				f.voiceB = b ? this.voiceB.getvolume() : -1;
				b = this.voiceC.enabled()
						& (this.noiseOutput | this.voiceC.mixNoise);
				f.voiceC = b ? this.voiceC.getvolume() : -1;
				this.voiceA.next();
				this.voiceB.next();
				this.voiceC.next();
				this.noisePos += this.noiseStep;
				this.envPos += this.envStep;
				if (this.envPos > 2147483647)
					this.envPos -= 2147483647;
				if (this.envPhase == 0 && this.envPos < this.envStep)
					envPhase = 1;
				if (this.syncBuzzer) {
					this.syncBuzzerPhase += this.syncBuzzerStep;
					if (this.syncBuzzerPhase & 1073741824) {
						this.envPos = 0;
						this.envPhase = 0;
						this.syncBuzzerPhase &= 1073741823
					}
				}
			}
			d += h;
			e = g;
			this.samplesLeft -= h
		}
		var k = event.outputBuffer.getChannelData(0);
		var l = event.outputBuffer.getChannelData(1);
		if (this.stereo) {
			for (c = 0; c < this.bufferSize; ++c) {
				f = this.buffer[c];
				k[c] = f.left();
				l[c] = f.right()
			}
		} else {
			for (c = 0; c < this.bufferSize; ++c) {
				i = this.buffer[c].mono();
				k[c] = i;
				l[c] = i
			}
		}
	};
	this.writeRegisters = function() {
		var a;
		this.registers[0] &= 255;
		this.registers[1] &= 15;
		this.voiceA.computeTone(this.registers[1], this.registers[0]);
		this.registers[2] &= 255;
		this.registers[3] &= 15;
		this.voiceB.computeTone(this.registers[3], this.registers[2]);
		this.registers[4] &= 255;
		this.registers[5] &= 15;
		this.voiceC.computeTone(this.registers[5], this.registers[4]);
		this.registers[6] &= 31;
		if (this.registers[6] < 3) {
			this.noisePos = 0;
			this.noiseOutput = 65535;
			this.noiseStep = 0
		} else {
			a = this.clock / ((this.registers[6] << 3) * this.audioFreq);
			this.noiseStep = Math.floor(a * 32768)
		}
		this.registers[7] &= 255;
		this.voiceA.mixTone = this.registers[7] & 1 ? 65535 : 0;
		this.voiceB.mixTone = this.registers[7] & 2 ? 65535 : 0;
		this.voiceC.mixTone = this.registers[7] & 4 ? 65535 : 0;
		this.voiceA.mixNoise = this.registers[7] & 8 ? 65535 : 0;
		this.voiceB.mixNoise = this.registers[7] & 16 ? 65535 : 0;
		this.voiceC.mixNoise = this.registers[7] & 32 ? 65535 : 0;
		this.registers[8] &= 31;
		this.voiceA.setvolume(this.registers[8]);
		this.registers[9] &= 31;
		this.voiceB.setvolume(this.registers[9]);
		this.registers[10] &= 31;
		this.voiceC.setvolume(this.registers[10]);
		this.registers[11] &= 255;
		this.registers[12] &= 255;
		a = this.registers[12] << 8 | this.registers[11];
		if (a < 3) {
			this.envStep = 0
		} else {
			a = this.clock / ((a << 8) * this.audioFreq);
			this.envStep = Math.floor(a * 1073741824)
		}
		if (this.registers[13] == 255) {
			this.registers[13] = 0
		} else {
			this.registers[13] &= 15;
			this.envPhase = 0;
			this.envPos = 0;
			this.envShape = this.registers[13]
		}
	};
	this.updateEffects = function(a, b, c) {
		var d = 0;
		var e = 0;
		var f = 0;
		a = this.registers[a] & 240;
		b = this.registers[b] >> 5 & 7;
		c = this.registers[c];
		if (a & 48) {
			f = ((a & 48) >> 4) - 1;
			switch (a & 192) {
			case 0:
			case 128:
				break;
			case 64:
				d = this.registers[f + 8] & 31;
				if (d >= 0 && d < this.song.drums) {
					b = YmConst_MFP_PREDIV[b] * c;
					if (b > 0) {
						e = 2457600 / b;
						if (f == 0) {
							this.voiceA.drum = this.song.digidrums[d];
							this.voiceA.drumStart(e)
						} else if (f == 1) {
							this.voiceB.drum = this.song.digidrums[d];
							this.voiceB.drumStart(e)
						} else if (f == 2) {
							this.voiceC.drum = this.song.digidrums[d];
							this.voiceC.drumStart(e)
						}
					}
				}
				break;
			case 192:
				break
			}
		}
	};
	this.syncBuzzerStart = function(a, b) {
		this.envShape = this.shapeEnv & 15;
		this.syncBuzzerStep = this.timerFreq * 1073741824 / this.audioFreq;
		this.syncBuzzerPhase = 0;
		this.syncBuzzer = true
	};
	this.syncBuzzerStop = function() {
		this.syncBuzzer = false;
		this.syncBuzzerPhase = 0;
		this.syncBuzzerStep = 0
	};
	this.stop = function() {
		this.reset();
		return true
	};
	this.reset = function() {
		var a;
		this.voiceA = new YmChannel(this);
		this.voiceB = new YmChannel(this);
		this.voiceC = new YmChannel(this);
		this.samplesLeft = 0;
		this.frame = 0;
		this.registers = new Array;
		for (a = 0; a < 16; ++a)
			this.registers[a] = 0;
		this.registers[7] = 255;
		this.writeRegisters();
		this.volumeEnv = 0;
		this.noiseOutput = 65535;
		this.noisePos = 0;
		this.noiseStep = 0;
		this.rng = 1;
		this.envPhase = 0;
		this.envPos = 0;
		this.envShape = 0;
		this.envStep = 0;
		this.syncBuzzerStop()
	};
	this.init();
	this.reset();
	CODEF_AUDIO_NODE.connect(CODEF_AUDIO_CONTEXT.destination)
}
function Sample() {
	this.voiceA = -1;
	this.voiceB = -1;
	this.voiceC = -1;
	this.mono = function() {
		var a = YmConst_MONO;
		var b = 0;
		if (this.voiceA > -1)
			b += a[this.voiceA];
		if (this.voiceB > -1)
			b += a[this.voiceB];
		if (this.voiceC > -1)
			b += a[this.voiceC];
		return b
	};
	this.left = function() {
		var a = YmConst_STEREO;
		var b = 0;
		if (this.voiceA > -1)
			b += a[this.voiceA];
		if (this.voiceB > -1)
			b += a[this.voiceB];
		return b
	};
	this.right = function() {
		var a = YmConst_STEREO;
		var b = 0;
		if (this.voiceB > -1)
			b += a[this.voiceB];
		if (this.voiceC > -1)
			b += a[this.voiceC];
		return b
	}
}
function YmChannel(a) {
	this.mixNoise = 0;
	this.mixTone = 0;
	this.mode = 0;
	this.position = 0;
	this.step = 0;
	this.digidrum = 0;
	this.drum = 0;
	this.drumPos = 0;
	this.drumStep = 0;
	this.processor = a;
	this.vol = 0;
	this.enabled = function() {
		return this.position >> 30 | this.mixTone
	};
	this.getvolume = function() {
		return this.mode ? this.processor.volumeEnv : this.vol
	};
	this.setvolume = function(a) {
		if (a & 16)
			this.mode = true;
		else
			this.mode = false;
		this.vol = a
	};
	this.next = function() {
		this.position += this.step;
		if (this.position > 2147483647)
			this.position -= 2147483647
	};
	this.computeTone = function(a, b) {
		var c = a << 8 | b;
		if (c < 5) {
			this.position = 1073741824;
			this.step = 0
		} else {
			c = this.processor.clock / ((c << 3) * this.processor.audioFreq);
			this.step = Math.floor(c * 1073741824)
		}
	};
	this.computeVolume = function() {
		var a;
		if (this.digidrum) {
			a = this.drumPos >> YmConst_DRUM_PREC;
			this.vol = this.drum.data[a] / 16;
			this.mixNoise = 65535;
			this.mixTone = 65535;
			this.drumPos += this.drumStep;
			a = this.drumPos >> YmConst_DRUM_PREC;
			if (a >= this.drum.size)
				this.digidrum = false
		}
	};
	this.drumStart = function(a) {
		this.digidrum = true;
		this.drumPos = 0;
		this.drumStep = (this.drumFreq << 15) / this.processor.audioFreq
	};
	this.drumStop = function() {
		this.digidrum = false
	}
}
function Digidrum(a) {
	this.data;
	this.repeatLen;
	this.size;
	this.wave = null;
	this.size = a;
	this.wave = new dataType;
	this.convert = function(a) {
		var b;
		var c;
		this.data = new Array;
		if (a & YmConst_DRUM_4BITS) {
			for (c = 0; c < this.size; ++c) {
				b = (this.wave.readByte() & 15) >> 7;
				this.data[c] = YmConst_MONO[b]
			}
		} else {
			for (c = 0; c < this.size; ++c) {
				this.data[c] = this.wave.readByte()
			}
		}
		this.wave = null
	}
}
function dataType() {
	this.data;
	this.pos = 0;
	this.endian = "BIG";
	this.readBytes = function(a, b) {
		var c = "";
		for ( var d = 0; d < b; d++) {
			c += this.data[a + this.pos++]
		}
		return c
	};
	this.readMultiByte = function(a, b) {
		if (b == "txt") {
			var c = "";
			for ( var d = 0; d < a; d++) {
				c += this.data[this.pos++]
			}
			return c
		}
	};
	this.readInt = function() {
		var a = parseInt(this.data[this.pos + 0].charCodeAt(0).toString(16), 16);
		var b = parseInt(this.data[this.pos + 1].charCodeAt(0).toString(16), 16);
		var c = parseInt(this.data[this.pos + 2].charCodeAt(0).toString(16), 16);
		var d = parseInt(this.data[this.pos + 3].charCodeAt(0).toString(16), 16);
		if (this.endian == "BIG")
			var e = a << 24 | b << 16 | c << 8 | d;
		else
			var e = d << 24 | c << 16 | b << 8 | a;
		this.pos += 4;
		return e
	};
	this.readShort = function() {
		var a = parseInt(this.data[this.pos + 0].charCodeAt(0).toString(16), 16);
		var b = parseInt(this.data[this.pos + 1].charCodeAt(0).toString(16), 16);
		var c = a << 8 | b;
		this.pos += 2;
		return c
	};
	this.readByte = function() {
		var a = parseInt(this.data[this.pos].charCodeAt(0).toString(16), 16);
		this.pos += 1;
		return a
	};
	this.readString = function() {
		var a = "";
		while (1) {
			if (this.data[this.pos++].charCodeAt(0) != 0)
				a += this.data[this.pos - 1];
			else
				return a
		}
	};
	this.substr = function(a, b) {
		return this.data.substr(a, b)
	};
	this.bytesAvailable = function() {
		return this.length - this.pos
	}
}
function LHa() {
	this.data;
	this.source;
	this.buffer;
	this.output;
	this.srcSize;
	this.dstSize;
	this.srcPos;
	this.dstPos;
	this.c_Table;
	this.p_Table;
	this.c_Len;
	this.p_Len;
	this.l_Tree;
	this.r_Tree;
	this.bitBuffer;
	this.bitCount;
	this.subBuffer;
	this.blockSize;
	this.fillBufferSize;
	this.fillIndex;
	this.decodei;
	this.decodej;
	this.data = "";
	this.buffer = new Array;
	this.output = new Array;
	this.c_Table = new Array;
	this.p_Table = new Array;
	this.c_Len = new Array;
	this.p_Len = new Array;
	this.l_Tree = new Array;
	this.r_Tree = new Array;
	this.unpack = function(a) {
		this.header = new LHaHeader(a);
		if (this.header.size == 0 || this.header.method != "-lh5-"
				|| this.header.level != 0)
			return a.data;
		this.source = a;
		this.srcSize = this.header.packed;
		this.srcPos = this.source.pos;
		this.dstSize = this.header.original;
		this.fillBufferSize = 0;
		this.bitBuffer = 0;
		this.bitCount = 0;
		this.subBuffer = 0;
		this.fillBuffer(16);
		this.blockSize = 0;
		this.decodej = 0;
		var b = this.dstSize;
		var c;
		var d;
		while (b != 0) {
			c = b > 8192 ? 8192 : b;
			this.decode(c);
			d = c > this.dstSize ? this.dstSize : c;
			if (d > 0) {
				this.output.pos = 0;
				for ( var e = 0; e < d; e++) {
					this.data += String.fromCharCode(this.output[e])
				}
				this.dstPos += d;
				this.dstSize -= d
			}
			b -= c
		}
		this.buffer = "";
		this.output = new Array;
		return this.data
	};
	this.decode = function(a) {
		var b;
		var c = 0;
		while (--this.decodej >= 0) {
			this.output[c] = this.output[this.decodei];
			this.decodei = ++this.decodei & 8191;
			if (++c == a)
				return
		}
		for (;;) {
			b = this.decode_c();
			if (b <= 255) {
				this.output[c] = b;
				if (++c == a)
					return
			} else {
				this.decodej = b - 253;
				this.decodei = c - this.decode_p() - 1 & 8191;
				while (--this.decodej >= 0) {
					this.output[c] = this.output[this.decodei];
					this.decodei = ++this.decodei & 8191;
					if (++c == a)
						return
				}
			}
		}
	};
	this.decode_c = function() {
		var a;
		var b = 0;
		if (this.blockSize == 0) {
			this.blockSize = this.getBits(16);
			this.read_p(19, 5, 3);
			this.read_c();
			this.read_p(14, 4, -1)
		}
		this.blockSize--;
		a = this.c_Table[this.bitBuffer >> 4];
		if (a >= 510) {
			b = 1 << 3;
			do {
				a = this.bitBuffer & b ? this.r_Tree[a] : this.l_Tree[a];
				b >>= 1
			} while (a >= 510)
		}
		this.fillBuffer(this.c_Len[a]);
		return a & 65535
	};
	this.decode_p = function() {
		var a = this.p_Table[this.bitBuffer >> 8];
		var b = 0;
		if (a >= 14) {
			b = 1 << 7;
			do {
				a = this.bitBuffer & b ? this.r_Tree[a] : this.l_Tree[a];
				b >>= 1
			} while (a >= 14)
		}
		this.fillBuffer(this.p_Len[a]);
		if (a != 0)
			a = (1 << a - 1) + this.getBits(a - 1);
		return a & 65535
	};
	this.read_c = function() {
		var a;
		var b = 0;
		var c = 0;
		var d = this.getBits(9);
		if (d == 0) {
			a = this.getBits(9);
			for (b = 0; b < 510; ++b)
				this.c_Len[b] = 0;
			for (b = 0; b < 4096; ++b)
				this.c_Table[b] = a
		} else {
			while (b < d) {
				a = this.p_Table[this.bitBuffer >> 8];
				if (a >= 19) {
					c = 1 << 7;
					do {
						a = this.bitBuffer & c ? this.r_Tree[a]
								: this.l_Tree[a];
						c >>= 1
					} while (a >= 19)
				}
				this.fillBuffer(this.p_Len[a]);
				if (a <= 2) {
					if (a == 0)
						a = 1;
					else if (a == 1)
						a = this.getBits(4) + 3;
					else
						a = this.getBits(9) + 20;
					while (--a >= 0)
						this.c_Len[b++] = 0
				} else {
					this.c_Len[b++] = a - 2
				}
			}
			while (b < 510)
				this.c_Len[b++] = 0;
			this.makeTable(510, this.c_Len, 12, this.c_Table)
		}
	};
	this.read_p = function(a, b, c) {
		var d;
		var e = 0;
		var f = 0;
		var g = this.getBits(b);
		if (g == 0) {
			d = this.getBits(b);
			for (e = 0; e < a; ++e)
				this.p_Len[e] = 0;
			for (e = 0; e < 256; ++e)
				this.p_Table[e] = d
		} else {
			while (e < g) {
				d = this.bitBuffer >> 13;
				if (d == 7) {
					f = 1 << 12;
					while (f & this.bitBuffer) {
						f >>= 1;
						d++
					}
				}
				this.fillBuffer(d < 7 ? 3 : d - 3);
				this.p_Len[e++] = d;
				if (e == c) {
					d = this.getBits(2);
					while (--d >= 0)
						this.p_Len[e++] = 0
				}
			}
			while (e < a)
				this.p_Len[e++] = 0;
			this.makeTable(a, this.p_Len, 8, this.p_Table)
		}
	};
	this.getBits = function(a) {
		var b = this.bitBuffer >> 16 - a;
		this.fillBuffer(a);
		return b & 65535
	};
	this.fillBuffer = function(a) {
		var b;
		this.bitBuffer = this.bitBuffer << a & 65535;
		while (a > this.bitCount) {
			this.bitBuffer |= this.subBuffer << (a -= this.bitCount);
			this.bitBuffer &= 65535;
			if (this.fillBufferSize == 0) {
				this.fillIndex = 0;
				b = this.srcSize > 4064 ? 4064 : this.srcSize;
				if (b > 0) {
					this.source.pos = this.srcPos;
					this.buffer = this.source.readBytes(0, b);
					this.srcPos += b;
					this.srcSize -= b
				}
				this.fillBufferSize = b
			}
			if (this.fillBufferSize > 0) {
				this.fillBufferSize--;
				this.subBuffer = this.buffer[this.fillIndex++].charCodeAt(0)
			} else {
				this.subBuffer = 0
			}
			this.bitCount = 8
		}
		this.bitBuffer |= this.subBuffer >> (this.bitCount -= a);
		this.bitBuffer &= 65535
	};
	this.makeTable = function(a, b, c, d) {
		var e = a;
		var f;
		var g;
		var h;
		var i;
		var j;
		var k;
		var l;
		var m;
		var n;
		var o = new Array;
		var p = new Array;
		var q = new Array;
		var r = 1 << 15 - c;
		for (g = 0; g < a; ++g)
			o[g] = 0;
		for (g = 0; g < a; ++g)
			o[b[g]]++;
		q[1] = 0;
		for (g = 1; g < 17; ++g)
			q[g + 1] = q[g] + (o[g] << 16 - g) & 65535;
		if (q[17] != 0)
			return false;
		h = 16 - c;
		for (g = 1; g <= c; ++g) {
			q[g] >>= h;
			p[g] = 1 << c - g
		}
		while (g < 17)
			p[g] = 1 << 16 - g++;
		g = q[c + 1] >> h;
		if (g != 0) {
			i = 1 << c;
			while (g != i)
				d[g++] = 0
		}
		for (f = 0; f < a; ++f) {
			if ((j = b[f]) == 0)
				continue;
			k = q[j] + p[j];
			if (j <= c) {
				for (g = q[j]; g < k; ++g)
					d[g] = f
			} else {
				g = j - c;
				i = q[j];
				l = i >> h;
				m = d;
				while (g != 0) {
					if (m[l] == 0) {
						this.l_Tree[e] = 0;
						this.r_Tree[e] = 0;
						m[l] = e++
					}
					n = i & r ? this.r_Tree : this.l_Tree;
					i <<= 1;
					g--
				}
				n[m[l]] = f
			}
			q[j] = k
		}
		return true
	}
}
function LHaHeader(a) {
	this.size;
	this.checksum;
	this.method;
	this.packed;
	this.original;
	this.timeStamp;
	this.attribute;
	this.level;
	this.nameLength;
	this.name;
	a.endian = "LITTLE";
	a.pos = 0;
	this.size = a.readByte();
	this.checksum = a.readByte();
	this.method = a.readMultiByte(5, "txt");
	this.packed = a.readInt();
	this.original = a.readInt();
	this.timeStamp = a.readInt();
	this.attribute = a.readByte();
	this.level = a.readByte();
	this.nameLength = a.readByte();
	this.name = a.readMultiByte(this.nameLength, "txt");
	a.readShort()
}
var CODEF_AUDIO_CONTEXT = null;
var CODEF_AUDIO_NODE = null;
var YmConst_BUFFER_SIZE = 8192;
var YmConst_PLAYER_FREQ = 48e3;
var YmConst_DRUM_PREC = 15;
var YmConst_AMSTRAD_FREQ = 1e6;
var YmConst_ATARI_FREQ = 2e6;
var YmConst_SPECTRUM_FREQ = 1773400;
var YmConst_INTERLEAVED = 1;
var YmConst_DRUM_SIGNED = 2;
var YmConst_DRUM_4BITS = 4;
var YmConst_TIME_CONTROL = 8;
var YmConst_LOOP_MODE = 16;
var YmConst_MFP_PREDIV = [ 0, 4, 10, 16, 50, 64, 100, 200 ];
var YmConst_MONO = [ .00063071586250394, .00163782667521185,
		.00269580167037975, .00383515935748365, .00590024516535946,
		.00787377544480728, .01174962614825892, .01602221747489853,
		.02299061047191789, .03141371908729311, .04648986276843572,
		.06340728985463016, .09491256447035126, .13414919481999166,
		.21586759036022013, .3333333333333333 ];
var YmConst_STEREO = [ .00094607379375591, .00245674001281777,
		.00404370250556963, .00575273903622547, .00885036774803918,
		.01181066316721091, .01762443922238838, .02403332621234779,
		.03448591570787683, .04712057863093966, .06973479415265357,
		.09511093478194525, .1423688467055269, .20122379222998749,
		.3238013855403302, .5 ];
var YmConst_ENVELOPES = [ 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12,
		11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7,
		6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
		15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3,
		4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
		1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13,
		12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13, 12, 11, 10, 9, 8,
		7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3,
		4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		10, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
		1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 15, 15,
		15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
		15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
		15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
		11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
		15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3,
		4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		10, 11, 12, 13, 14, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
		15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
		15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 14, 13, 12,
		11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 15, 14, 13, 12, 11, 10, 9, 8, 7,
		6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
		15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
(function() {
	function a(a, b) {
		var c = Object.create(null, {
			endian : {
				value : 1,
				writable : true
			},
			length : {
				value : 0,
				writable : true
			},
			index : {
				value : 0,
				writable : true
			},
			buffer : {
				value : null,
				writable : true
			},
			view : {
				value : null,
				writable : true
			},
			bytesAvailable : {
				get : function() {
					return this.length - this.index
				}
			},
			position : {
				get : function() {
					return this.index
				},
				set : function(a) {
					if (a < 0)
						a = 0;
					else if (a > this.length)
						a = this.length;
					this.index = a
				}
			},
			clear : {
				value : function() {
					this.buffer = new ArrayBuffer;
					this.view = null;
					this.index = this.length = 0
				}
			},
			readAt : {
				value : function(a) {
					return this.view.getUint8(a)
				}
			},
			readByte : {
				value : function() {
					return this.view.getInt8(this.index++)
				}
			},
			readShort : {
				value : function() {
					var a = this.view.getInt16(this.index, this.endian);
					this.index += 2;
					return a
				}
			},
			readInt : {
				value : function() {
					var a = this.view.getInt32(this.index, this.endian);
					this.index += 4;
					return a
				}
			},
			readUbyte : {
				value : function() {
					return this.view.getUint8(this.index++)
				}
			},
			readUshort : {
				value : function() {
					var a = this.view.getUint16(this.index, this.endian);
					this.index += 2;
					return a
				}
			},
			readUint : {
				value : function() {
					var a = this.view.getUint32(this.index, this.endian);
					this.index += 4;
					return a
				}
			},
			readBytes : {
				value : function(a, b, c) {
					var d = a.view, e = this.index, f = this.view;
					if ((c += e) > this.length)
						c = this.length;
					for (; e < c; ++e)
						d.setUint8(b++, f.getUint8(e));
					this.index = e
				}
			},
			readString : {
				value : function(a) {
					var b = this.index, c = this.view, d = "";
					if ((a += b) > this.length)
						a = this.length;
					for (; b < a; ++b)
						d += String.fromCharCode(c.getUint8(b));
					this.index = a;
					return d
				}
			},
			writeAt : {
				value : function(a, b) {
					this.view.setUint8(a, b)
				}
			},
			writeByte : {
				value : function(a) {
					this.view.setInt8(this.index++, a)
				}
			},
			writeShort : {
				value : function(a) {
					this.view.setInt16(this.index, a);
					this.index += 2
				}
			},
			writeInt : {
				value : function(a) {
					this.view.setInt32(this.index, a);
					this.index += 4
				}
			}
		});
		c.buffer = a;
		c.view = new DataView(a);
		c.length = a.byteLength;
		return Object.seal(c)
	}
	function b() {
		return Object.create(null, {
			l : {
				value : 0,
				writable : true
			},
			r : {
				value : 0,
				writable : true
			},
			next : {
				value : null,
				writable : true
			}
		})
	}
	function c() {
		return Object.create(null, {
			player : {
				value : null,
				writable : true
			},
			channels : {
				value : [],
				writable : true
			},
			buffer : {
				value : [],
				writable : true
			},
			samplesTick : {
				value : 0,
				writable : true
			},
			samplesLeft : {
				value : 0,
				writable : true
			},
			remains : {
				value : 0,
				writable : true
			},
			completed : {
				value : 0,
				writable : true
			},
			bufferSize : {
				get : function() {
					return this.buffer.length
				},
				set : function(a) {
					var c, d = this.buffer.length || 0;
					if (a == d || a < 512)
						return;
					this.buffer.length = a;
					if (a > d) {
						this.buffer[d] = b();
						for (c = ++d; c < a; ++c)
							this.buffer[c] = this.buffer[c - 1].next = b()
					}
				}
			},
			complete : {
				get : function() {
					return this.completed
				},
				set : function(a) {
					this.completed = a ^ this.player.loopSong
				}
			},
			reset : {
				value : function() {
					var a = this.channels[0], b = this.buffer[0];
					this.samplesLeft = 0;
					this.remains = 0;
					this.completed = 0;
					while (a) {
						a.initialize();
						a = a.next
					}
					while (b) {
						b.l = b.r = 0;
						b = b.next
					}
				}
			},
			restore : {
				configurable : true,
				value : function() {
				}
			}
		})
	}
	function d() {
		var b = Object
				.create(
						null,
						{
							context : {
								value : null,
								writable : true
							},
							node : {
								value : null,
								writable : true
							},
							analyse : {
								value : 0,
								writable : true
							},
							endian : {
								value : 0,
								writable : true
							},
							sampleRate : {
								value : 0,
								writable : true
							},
							playSong : {
								value : 0,
								writable : true
							},
							lastSong : {
								value : 0,
								writable : true
							},
							version : {
								value : 0,
								writable : true
							},
							title : {
								value : "",
								writable : true
							},
							channels : {
								value : 0,
								writable : true
							},
							loopSong : {
								value : 1,
								writable : true
							},
							speed : {
								value : 0,
								writable : true
							},
							tempo : {
								value : 0,
								writable : true
							},
							mixer : {
								value : null,
								writable : true
							},
							tick : {
								value : 0,
								writable : true
							},
							paused : {
								value : 0,
								writable : true
							},
							callback : {
								value : null,
								writable : true
							},
							quality : {
								configurable : true,
								set : function(a) {
									this.callback = a ? this.mixer.accurate
											.bind(this.mixer) : this.mixer.fast
											.bind(this.mixer)
								}
							},
							toggle : {
								value : function(a) {
									this.mixer.channels[a].mute ^= 1
								}
							},
							setup : {
								configurable : true,
								value : function() {
								}
							},
							load : {
								value : function(b) {
									this.version = 0;
									this.playSong = 0;
									this.lastSong = 0;
									this.mixer.restore();
									if (!b.view)
										b = a(b);
									b.position = 0;
									if (b.readUint() == 67324752) {
										if (window.neoart.Unzip) {
											var c = e(b);
											b = c.uncompress(c.entries[0])
										} else {
											throw "Unzip support is not available."
										}
									}
									b.endian = this.endian;
									b.position = 0;
									this.loader(b);
									if (this.version)
										this.setup();
									return this.version
								}
							},
							play : {
								value : function() {
									var a, b;
									if (!this.version)
										return;
									if (this.paused) {
										this.paused = 0
									} else {
										this.initialize();
										this.node = this.context
												.createJavaScriptNode(this.mixer.bufferSize);
										this.node.onaudioprocess = this.callback
									}
									if (this.analyse && window.neoart.Flectrum) {
										b = window.neoart.analyserNode = this.context
												.createAnalyser();
										this.node.connect(b);
										b.connect(this.context.destination)
									} else {
										this.node
												.connect(this.context.destination)
									}
									a = document.createEvent("Event");
									a.initEvent("flodPlay", true, false);
									document.dispatchEvent(a)
								}
							},
							pause : {
								value : function() {
									if (this.node) {
										this.node.disconnect();
										this.paused = 1;
										var a = document.createEvent("Event");
										a.initEvent("flodPause", true, false);
										document.dispatchEvent(a)
									}
								}
							},
							stop : {
								value : function() {
									if (this.node) {
										this.node.disconnect();
										this.node.onaudioprocess = this.node = null;
										this.paused = 0;
										if (this.restore)
											this.restore();
										var a = document.createEvent("Event");
										a.initEvent("flodStop", true, false);
										document.dispatchEvent(a)
									}
								}
							},
							reset : {
								value : function() {
									this.tick = 0;
									this.mixer.initialize();
									this.mixer.samplesTick = this.sampleRate
											* 2.5 / this.tempo >> 0
								}
							}
						});
		if (!window.neoart.audioContext)
			window.neoart.audioContext = new webkitAudioContext;
		b.context = window.neoart.audioContext;
		b.sampleRate = b.context.sampleRate;
		return b
	}
	function e(b) {
		function w(a) {
			var b = Object.create(null, {
				count : {
					value : null,
					writable : true
				},
				symbol : {
					value : null,
					writable : true
				}
			});
			b.count = new Uint16Array(a);
			b.symbol = new Uint16Array(a);
			return Object.seal(b)
		}
		function x() {
			var b = Object
					.create(
							null,
							{
								output : {
									value : null,
									writable : true
								},
								inpbuf : {
									value : null,
									writable : true
								},
								inpcnt : {
									value : 0,
									writable : true
								},
								outcnt : {
									value : 0,
									writable : true
								},
								bitbuf : {
									value : 0,
									writable : true
								},
								bitcnt : {
									value : 0,
									writable : true
								},
								flencode : {
									value : null,
									writable : true
								},
								fdiscode : {
									value : null,
									writable : true
								},
								dlencode : {
									value : null,
									writable : true
								},
								ddiscode : {
									value : null,
									writable : true
								},
								input : {
									set : function(b) {
										this.inpbuf = b[0];
										this.inpbuf.endian = b[2];
										this.inpbuf.position = 0;
										this.inpcnt = 0;
										this.output = a(new ArrayBuffer(b[1]));
										this.output.endian = b[2];
										this.output.position = 0;
										this.outcnt = 0
									}
								},
								inflate : {
									value : function() {
										var a, b, c;
										do {
											b = this.bits(1);
											c = this.bits(2);
											a = c == 0 ? this.stored()
													: c == 1 ? this.codes(
															this.flencode,
															this.fdiscode)
															: c == 2 ? this
																	.dynamic()
																	: 1;
											if (a)
												throw g
										} while (!b)
									}
								},
								initialize : {
									value : function() {
										var a = new Uint8Array(288), b = 0;
										this.flencode = w(288);
										this.fdiscode = w(30);
										for (; b < 144; ++b)
											a[b] = 8;
										for (; b < 256; ++b)
											a[b] = 9;
										for (; b < 280; ++b)
											a[b] = 7;
										for (; b < 288; ++b)
											a[b] = 8;
										this.construct(this.fdiscode, a, 288);
										for (b = 0; b < 30; ++b)
											a[b] = 5;
										this.construct(this.fdiscode, a, 30);
										this.dlencode = w(286);
										this.ddiscode = w(30)
									}
								},
								construct : {
									value : function(a, b, c) {
										var d = 0, e = 1, f = new Uint16Array(
												16), g = 0;
										for (; d < 16; ++d)
											a.count[d] = 0;
										for (; g < c; ++g)
											a.count[b[g]]++;
										if (a.count[0] == c)
											return 0;
										for (d = 1; d < 16; ++d) {
											e <<= 1;
											e -= a.count[d];
											if (e < 0)
												return e
										}
										for (d = 1; d < 15; ++d)
											f[d + 1] = f[d] + a.count[d];
										for (g = 0; g < c; ++g)
											if (b[g] != 0)
												a.symbol[f[b[g]]++] = g;
										return e
									}
								},
								bits : {
									value : function(a) {
										var b = this.bitbuf, c = this.inpbuf.length;
										while (this.bitcnt < a) {
											if (this.inpcnt == c)
												throw h;
											b |= this.inpbuf
													.readAt(this.inpcnt++) << this.bitcnt;
											this.bitcnt += 8
										}
										this.bitbuf = b >> a;
										this.bitcnt -= a;
										return b & (1 << a) - 1
									}
								},
								codes : {
									value : function(a, b) {
										var c, d, e, f;
										do {
											f = this.decode(a);
											if (f < 0)
												return f;
											if (f < 256) {
												this.output.writeAt(
														this.outcnt++, f)
											} else if (f > 256) {
												f -= 257;
												if (f >= 29)
													throw ERRRO7;
												d = r[f] + this.bits(s[f]);
												f = this.decode(b);
												if (f < 0)
													return f;
												c = t[f] + this.bits(u[f]);
												if (c > this.outcnt)
													throw j;
												e = this.outcnt - c;
												while (d--)
													this.output
															.writeAt(
																	this.outcnt++,
																	this.output
																			.readAt(e++))
											}
										} while (f != 256);
										return 0
									}
								},
								decode : {
									value : function(a) {
										var b = this.bitbuf, c = 0, d, e = 0, f = 0, g = this.inpbuf.length, i = this.bitcnt, j = 1;
										while (1) {
											while (i--) {
												c |= b & 1;
												b >>= 1;
												d = a.count[j];
												if (c < e + d) {
													this.bitbuf = b;
													this.bitcnt = this.bitcnt
															- j & 7;
													return a.symbol[f + (c - e)]
												}
												f += d;
												e += d;
												e <<= 1;
												c <<= 1;
												++j
											}
											i = 16 - j;
											if (!i)
												break;
											if (this.inpcnt == g)
												throw h;
											b = this.inpbuf
													.readAt(this.inpcnt++);
											if (i > 8)
												i = 8
										}
										return -9
									}
								},
								stored : {
									value : function() {
										var a = this.inpbuf.length, b;
										this.bitbuf = this.bitcnt = 0;
										if (this.inpcnt + 4 > a)
											throw h;
										b = this.inpbuf.readAt(this.inpcnt++);
										b |= this.inpbuf.readAt(this.inpcnt++) << 8;
										if (this.inpbuf.readAt(this.inpcnt++) != (~b & 255)
												|| this.inpbuf
														.readAt(this.inpcnt++) != (~b >> 8 & 255))
											throw k;
										if (this.inpcnt + b > a)
											throw h;
										while (b--)
											this.output
													.writeAt(
															this.outcnt++,
															this.inpbuf
																	.readAt(this.inpcnt++));
										return 0
									}
								},
								dynamic : {
									value : function() {
										var a = new Uint8Array(316), b, c = 0, d, e = this
												.bits(5) + 257, f = this
												.bits(5) + 1, g = this.bits(4) + 4, h = e
												+ f, i;
										if (e > 286 || f > 30)
											throw l;
										for (; c < g; ++c)
											a[v[c]] = this.bits(3);
										for (; c < 19; ++c)
											a[v[c]] = 0;
										b = this
												.construct(this.dlencode, a, 19);
										if (b)
											throw m;
										c = 0;
										while (c < h) {
											i = this.decode(this.dlencode);
											if (i < 16) {
												a[c++] = i
											} else {
												d = 0;
												if (i == 16) {
													if (c == 0)
														throw n;
													d = a[c - 1];
													i = 3 + this.bits(2)
												} else if (i == 17) {
													i = 3 + this.bits(3)
												} else {
													i = 11 + this.bits(7)
												}
												if (c + i > h)
													throw o;
												while (i--)
													a[c++] = d
											}
										}
										b = this.construct(this.dlencode, a, e);
										if (b < 0
												|| b > 0
												&& e - this.dlencode.count[0] != 1)
											throw p;
										b = this.construct(this.ddiscode, a
												.subarray(e), f);
										if (b < 0
												|| b > 0
												&& f - this.ddiscode.count[0] != 1)
											throw q;
										return this.codes(this.dlencode,
												this.ddiscode)
									}
								}
							});
			b.initialize();
			return Object.seal(b)
		}
		function y() {
			return Object.create(null, {
				name : {
					value : "",
					writable : true
				},
				extra : {
					value : null,
					writable : true
				},
				version : {
					value : 0,
					writable : true
				},
				flag : {
					value : 0,
					writable : true
				},
				method : {
					value : 0,
					writable : true
				},
				time : {
					value : 0,
					writable : true
				},
				crc : {
					value : 0,
					writable : true
				},
				compressed : {
					value : 0,
					writable : true
				},
				size : {
					value : 0,
					writable : true
				},
				offset : {
					value : 0,
					writable : true
				},
				date : {
					get : function() {
						return new Date((this.time >> 25 & 127) + 1980,
								(this.time >> 21 & 15) - 1,
								this.time >> 16 & 31, this.time >> 11 & 31,
								this.time >> 5 & 63, (this.time & 31) << 1)
					}
				},
				isDirectory : {
					get : function() {
						return this.name.charAt(this.name.length - 1) == "/"
					}
				}
			})
		}
		if (!b)
			return null;
		var c = "The archive is either in unknown format or damaged.", d = "Unexpected end of archive.", e = "Encrypted archive not supported.", f = "Compression method not supported.", g = "Invalid block type.", h = "Available inflate data did not terminate.", i = "Invalid literal/length or distance code.", j = "Distance is too far back.", k = "Stored block length did not match one's complement.", l = "Too many length or distance codes.", m = "Code lengths codes incomplete.", n = "Repeat lengths with no first length.", o = "Repeat more than specified lengths.", p = "Invalid literal/length code lengths.", q = "Invalid distance code lengths.", r = [
				3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35,
				43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258 ], s = [
				0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4,
				4, 4, 4, 5, 5, 5, 5, 0 ], t = [ 1, 2, 3, 4, 5, 7, 9, 13, 17,
				25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537,
				2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577 ], u = [ 0,
				0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9,
				10, 10, 11, 11, 12, 12, 13, 13 ], v = [ 16, 17, 18, 0, 8, 7, 9,
				6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];
		var z = Object.create(null, {
			endian : {
				value : 1,
				writable : true
			},
			entries : {
				value : null,
				writable : true
			},
			stream : {
				value : null,
				writable : true
			},
			uncompress : {
				value : function(b) {
					var c = this.stream, d, e = false, g, h, i, j, k;
					if (!b)
						return null;
					if (typeof b == "string") {
						j = this.entries.length;
						for (g = 0; g < j; ++g) {
							i = this.entries[g];
							if (i.name == b) {
								b = i;
								e = true;
								break
							}
						}
						if (!e)
							return null
					}
					c.position = b.offset + 28;
					k = c.readUshort();
					c.position += b.name.length + k;
					if (b.compressed) {
						d = a(new ArrayBuffer(b.compressed), this.endian);
						c.readBytes(d, 0, b.compressed);
						switch (b.method) {
						case 0:
							return d;
							break;
						case 8:
							h = x();
							h.input = [ d, b.size, this.endian ];
							h.inflate();
							return h.output;
							break;
						default:
							throw f;
							break
						}
					}
				}
			},
			parseCentral : {
				value : function() {
					var b = this.stream, c, f = a(new ArrayBuffer(46),
							this.endian), g, h = this.entries.length, i;
					for (g = 0; g < h; ++g) {
						b.readBytes(f, 0, 46);
						f.position = 0;
						if (f.readUint() != 33639248)
							throw d;
						f.position += 24;
						i = f.readUshort();
						if (!i)
							throw d;
						c = y();
						c.name = b.readString(i);
						i = f.readUshort();
						if (i) {
							c.extra = a(new ArrayBuffer(i), this.endian);
							b.readBytes(c.extra, 0, i)
						}
						b.position += f.readUshort();
						f.position = 6;
						c.version = f.readUshort();
						c.flag = f.readUshort();
						if ((c.flag & 1) == 1)
							throw e;
						c.method = f.readUshort();
						c.time = f.readUint();
						c.crc = f.readUint();
						c.compressed = f.readUint();
						c.size = f.readUint();
						f.position = 42;
						c.offset = f.readUint();
						Object.freeze(c);
						this.entries[g] = c
					}
				}
			},
			parseEnd : {
				value : function() {
					var a = this.stream, b = a.length - 22, d = b - 65536;
					if (d < 0)
						d = 0;
					do {
						if (a.readAt(b) != 80)
							continue;
						a.position = b;
						if (a.readUint() == 101010256)
							break
					} while (--b > d);
					if (b == d)
						throw c;
					a.position = b + 10;
					this.entries = [];
					this.entries.length = a.readUshort();
					a.position = b + 16;
					a.position = a.readUint();
					this.parseCentral()
				}
			}
		});
		if (!b.view)
			b = a(b);
		b.endian = 1;
		b.position = 0;
		z.stream = b;
		z.parseEnd();
		return Object.seal(z)
	}
	function f(a) {
		var b = Object.create(null, {
			next : {
				value : null,
				writable : true
			},
			mute : {
				value : 0,
				writable : true
			},
			panning : {
				value : 0,
				writable : true
			},
			delay : {
				value : 0,
				writable : true
			},
			pointer : {
				value : 0,
				writable : true
			},
			length : {
				value : 0,
				writable : true
			},
			audena : {
				value : 0,
				writable : true
			},
			audcnt : {
				value : 0,
				writable : true
			},
			audloc : {
				value : 0,
				writable : true
			},
			audper : {
				value : 0,
				writable : true
			},
			audvol : {
				value : 0,
				writable : true
			},
			timer : {
				value : 0,
				writable : true
			},
			level : {
				value : 0,
				writable : true
			},
			ldata : {
				value : 0,
				writable : true
			},
			rdata : {
				value : 0,
				writable : true
			},
			enabled : {
				get : function() {
					return this.audena
				},
				set : function(a) {
					if (a == this.audena)
						return;
					this.audena = a;
					this.audloc = this.pointer;
					this.audcnt = this.pointer + this.length;
					this.timer = 1;
					if (a)
						this.delay += 2
				}
			},
			period : {
				set : function(a) {
					if (a < 0)
						a = 0;
					else if (a > 65535)
						a = 65535;
					this.audper = a
				}
			},
			volume : {
				set : function(a) {
					if (a < 0)
						a = 0;
					else if (a > 64)
						a = 64;
					this.audvol = a
				}
			},
			resetData : {
				value : function() {
					this.ldata = 0;
					this.rdata = 0
				}
			},
			initialize : {
				value : function() {
					this.audena = 0;
					this.audcnt = 0;
					this.audloc = 0;
					this.audper = 50;
					this.audvol = 0;
					this.timer = 0;
					this.ldata = 0;
					this.rdata = 0;
					this.delay = 0;
					this.pointer = 0;
					this.length = 0
				}
			}
		});
		b.panning = b.level = (++a & 2) == 0 ? -1 : 1;
		return Object.seal(b)
	}
	function g() {
		return Object
				.create(
						null,
						{
							active : {
								value : 0,
								writable : true
							},
							forced : {
								value : -1,
								writable : true
							},
							l0 : {
								value : 0,
								writable : true
							},
							l1 : {
								value : 0,
								writable : true
							},
							l2 : {
								value : 0,
								writable : true
							},
							l3 : {
								value : 0,
								writable : true
							},
							l4 : {
								value : 0,
								writable : true
							},
							r0 : {
								value : 0,
								writable : true
							},
							r1 : {
								value : 0,
								writable : true
							},
							r2 : {
								value : 0,
								writable : true
							},
							r3 : {
								value : 0,
								writable : true
							},
							r4 : {
								value : 0,
								writable : true
							},
							initialize : {
								value : function() {
									this.l0 = this.l1 = this.l2 = this.l3 = this.l4 = 0;
									this.r0 = this.r1 = this.r2 = this.r3 = this.r4 = 0
								}
							},
							process : {
								value : function(a, b) {
									var c = .52133458435322, d = .4860348337215757, e = .9314955486749749, f = 1 - d;
									if (a == 0) {
										this.l0 = d * b.l + f * this.l0;
										this.r0 = d * b.r + f * this.r0;
										f = 1 - e;
										b.l = this.l1 = e * this.l0 + f
												* this.l1;
										b.r = this.r1 = e * this.r0 + f
												* this.r1
									}
									if ((this.active | this.forced) > 0) {
										f = 1 - c;
										this.l2 = c * b.l + f * this.l2;
										this.r2 = c * b.r + f * this.r2;
										this.l3 = c * this.l2 + f * this.l3;
										this.r3 = c * this.r2 + f * this.r3;
										b.l = this.l4 = c * this.l3 + f
												* this.l4;
										b.r = this.r4 = c * this.r3 + f
												* this.r4
									}
									if (b.l > 1)
										b.l = 1;
									else if (b.l < -1)
										b.l = -1;
									if (b.r > 1)
										b.r = 1;
									else if (b.r < -1)
										b.r = -1
								}
							}
						})
	}
	function h() {
		return Object.create(null, {
			note : {
				value : 0,
				writable : true
			},
			sample : {
				value : 0,
				writable : true
			},
			effect : {
				value : 0,
				writable : true
			},
			param : {
				value : 0,
				writable : true
			}
		})
	}
	function i() {
		return Object.create(null, {
			name : {
				value : "",
				writable : true
			},
			length : {
				value : 0,
				writable : true
			},
			loop : {
				value : 0,
				writable : true
			},
			repeat : {
				value : 0,
				writable : true
			},
			volume : {
				value : 0,
				writable : true
			},
			pointer : {
				value : 0,
				writable : true
			},
			loopPtr : {
				value : 0,
				writable : true
			}
		})
	}
	function j() {
		return Object.create(null, {
			pattern : {
				value : 0,
				writable : true
			},
			transpose : {
				value : 0,
				writable : true
			}
		})
	}
	function k() {
		var a = c();
		Object
				.defineProperties(
						a,
						{
							filter : {
								value : null,
								writable : true
							},
							model : {
								value : 1,
								writable : true
							},
							memory : {
								value : [],
								writable : true
							},
							loopPtr : {
								value : 0,
								writable : true
							},
							loopLen : {
								value : 4,
								writable : true
							},
							clock : {
								value : 0,
								writable : true
							},
							master : {
								value : 0,
								writable : true
							},
							ready : {
								value : 0,
								writable : true
							},
							volume : {
								set : function(a) {
									if (a > 0) {
										if (a > 64)
											a = 64;
										this.master = a / 64 * .00390625
									} else {
										this.master = 0
									}
								}
							},
							initialize : {
								value : function() {
									var a = this.memory.length, b = a
											+ this.loopLen;
									this.reset();
									this.filter.initialize();
									if (!this.ready) {
										this.ready = 1;
										this.loopPtr = a;
										for (; a < b; ++a)
											this.memory[a] = 0
									}
								}
							},
							restore : {
								value : function() {
									this.ready = 0;
									this.memory.length = 0
								}
							},
							store : {
								value : function(a, b, c) {
									var d, e, f = a.position, g = this.memory.length, h;
									if (c)
										a.position = c;
									h = a.position + b;
									if (h >= a.length) {
										d = h - a.length;
										b = a.length - a.position
									}
									for (e = g, b += g; e < b; ++e)
										this.memory[e] = a.readByte();
									for (b += d; e < b; ++e)
										this.memory[e] = 0;
									if (c)
										a.position = f;
									return g
								}
							},
							fast : {
								value : function(a) {
									var b, c, d, e, f = this.memory, g, h = 0, i, j = 0, e, k, l, m = this.bufferSize, n, o, p;
									if (this.completed) {
										if (!this.remains) {
											this.player.stop();
											return
										}
										m = this.remains
									}
									while (h < m) {
										if (!this.samplesLeft) {
											this.player.process();
											this.samplesLeft = this.samplesTick;
											if (this.completed) {
												m = h + this.samplesTick;
												if (m > this.bufferSize) {
													this.remains = m
															- this.bufferSize;
													m = this.bufferSize
												}
											}
										}
										o = this.samplesLeft;
										if (h + o >= m)
											o = m - h;
										i = j + o;
										b = this.channels[0];
										while (b) {
											l = this.buffer[j];
											if (b.audena && b.audper > 60) {
												n = b.audper / this.clock;
												p = b.audvol * this.master;
												g = p * (1 - b.level);
												k = p * (1 + b.level);
												for (c = j; c < i; ++c) {
													if (b.delay) {
														b.delay--
													} else if (--b.timer < 1) {
														if (!b.mute) {
															p = f[b.audloc] * .0078125;
															b.ldata = p * g;
															b.rdata = p * k
														}
														b.audloc++;
														b.timer += n;
														if (b.audloc >= b.audcnt) {
															b.audloc = b.pointer;
															b.audcnt = b.pointer
																	+ b.length
														}
													}
													l.l += b.ldata;
													l.r += b.rdata;
													l = l.next
												}
											} else {
												for (c = j; c < i; ++c) {
													l.l += b.ldata;
													l.r += b.rdata;
													l = l.next
												}
											}
											b = b.next
										}
										j = i;
										h += o;
										this.samplesLeft -= o
									}
									p = this.model;
									f = this.filter;
									l = this.buffer[0];
									d = a.outputBuffer.getChannelData(0);
									e = a.outputBuffer.getChannelData(1);
									for (c = 0; c < m; ++c) {
										f.process(p, l);
										d[c] = l.l;
										e[c] = l.r;
										l.l = l.r = 0;
										l = l.next
									}
								}
							}
						});
		a.channels[0] = f(0);
		a.channels[0].next = a.channels[1] = f(1);
		a.channels[1].next = a.channels[2] = f(2);
		a.channels[2].next = a.channels[3] = f(3);
		a.bufferSize = 8192;
		a.filter = g();
		a.master = .00390625;
		return Object.seal(a)
	}
	function l(a) {
		var b = d();
		Object.defineProperties(b, {
			quality : {
				set : function(a) {
					this.callback = this.mixer.fast.bind(this.mixer)
				}
			},
			stereo : {
				set : function(a) {
					var b = this.mixer.channels[0];
					if (a < 0)
						a = 0;
					else if (a > 1)
						a = 1;
					while (b) {
						b.level = a * b.panning;
						b = b.next
					}
				}
			},
			volume : {
				set : function(a) {
					if (a < 0)
						a = 0;
					else if (a > 1)
						a = 1;
					this.mixer.master = a * .00390625
				}
			},
			frequency : {
				value : function(a) {
					if (a) {
						this.mixer.clock = 3579545 / this.sampleRate;
						this.mixer.samplesTick = 735
					} else {
						this.mixer.clock = 3546895 / this.sampleRate;
						this.mixer.samplesTick = 882
					}
				}
			}
		});
		b.mixer = a || k();
		b.mixer.player = b;
		b.frequency(0);
		b.channels = 4;
		b.endian = 0;
		b.quality = 0;
		b.speed = 6;
		b.tempo = 125;
		return b
	}
	function m() {
		return Object.create(null, {
			next : {
				value : null,
				writable : true
			},
			mute : {
				value : 0,
				writable : true
			},
			enabled : {
				value : 0,
				writable : true
			},
			sample : {
				value : null,
				writable : true
			},
			length : {
				value : 0,
				writable : true
			},
			index : {
				value : 0,
				writable : true
			},
			pointer : {
				value : 0,
				writable : true
			},
			delta : {
				value : 0,
				writable : true
			},
			fraction : {
				value : 0,
				writable : true
			},
			speed : {
				value : 0,
				writable : true
			},
			dir : {
				value : 0,
				writable : true
			},
			oldSample : {
				value : null,
				writable : true
			},
			oldLength : {
				value : 0,
				writable : true
			},
			oldPointer : {
				value : 0,
				writable : true
			},
			oldFraction : {
				value : 0,
				writable : true
			},
			oldSpeed : {
				value : 0,
				writable : true
			},
			oldDir : {
				value : 0,
				writable : true
			},
			volume : {
				value : 0,
				writable : true
			},
			lvol : {
				value : 0,
				writable : true
			},
			rvol : {
				value : 0,
				writable : true
			},
			panning : {
				value : 128,
				writable : true
			},
			lpan : {
				value : .5,
				writable : true
			},
			rpan : {
				value : .5,
				writable : true
			},
			ldata : {
				value : 0,
				writable : true
			},
			rdata : {
				value : 0,
				writable : true
			},
			mixCounter : {
				value : 0,
				writable : true
			},
			lmixRampU : {
				value : 0,
				writable : true
			},
			lmixDeltaU : {
				value : 0,
				writable : true
			},
			rmixRampU : {
				value : 0,
				writable : true
			},
			rmixDeltaU : {
				value : 0,
				writable : true
			},
			lmixRampD : {
				value : 0,
				writable : true
			},
			lmixDeltaD : {
				value : 0,
				writable : true
			},
			rmixRampD : {
				value : 0,
				writable : true
			},
			rmixDeltaD : {
				value : 0,
				writable : true
			},
			volCounter : {
				value : 0,
				writable : true
			},
			lvolDelta : {
				value : 0,
				writable : true
			},
			rvolDelta : {
				value : 0,
				writable : true
			},
			panCounter : {
				value : 0,
				writable : true
			},
			lpanDelta : {
				value : 0,
				writable : true
			},
			rpanDelta : {
				value : 0,
				writable : true
			},
			initialize : {
				value : function() {
					this.enabled = 0;
					this.sample = null;
					this.length = 0;
					this.index = 0;
					this.pointer = 0;
					this.delta = 0;
					this.fraction = 0;
					this.speed = 0;
					this.dir = 0;
					this.oldSample = null;
					this.oldLength = 0;
					this.oldPointer = 0;
					this.oldFraction = 0;
					this.oldSpeed = 0;
					this.oldDir = 0;
					this.volume = 0;
					this.lvol = 0;
					this.rvol = 0;
					this.panning = 128;
					this.lpan = .5;
					this.rpan = .5;
					this.ldata = 0;
					this.rdata = 0;
					this.mixCounter = 0;
					this.lmixRampU = 0;
					this.lmixDeltaU = 0;
					this.rmixRampU = 0;
					this.rmixDeltaU = 0;
					this.lmixRampD = 0;
					this.lmixDeltaD = 0;
					this.rmixRampD = 0;
					this.rmixDeltaD = 0;
					this.volCounter = 0;
					this.lvolDelta = 0;
					this.rvolDelta = 0;
					this.panCounter = 0;
					this.lpanDelta = 0;
					this.rpanDelta = 0
				}
			}
		})
	}
	function n() {
		return Object.create(null, {
			name : {
				value : "",
				writable : true
			},
			bits : {
				value : 8,
				writable : true
			},
			volume : {
				value : 0,
				writable : true
			},
			length : {
				value : 0,
				writable : true
			},
			data : {
				value : [],
				writable : true
			},
			loopMode : {
				value : 0,
				writable : true
			},
			loopStart : {
				value : 0,
				writable : true
			},
			loopLen : {
				value : 0,
				writable : true
			},
			store : {
				value : function(a) {
					var b = 0, c, d = this.length, e, f, g, h;
					if (!this.loopLen)
						this.loopMode = 0;
					e = a.position;
					if (this.loopMode) {
						d = this.loopStart + this.loopLen;
						this.data = new Float32Array(d + 1)
					} else {
						this.data = new Float32Array(this.length + 1)
					}
					if (this.bits == 8) {
						g = e + d;
						if (g > a.length)
							d = a.length - e;
						for (c = 0; c < d; c++) {
							h = a.readByte() + b;
							if (h < -128)
								h += 256;
							else if (h > 127)
								h -= 256;
							this.data[c] = h * .0078125;
							b = h
						}
					} else {
						g = e + (d << 1);
						if (g > a.length)
							d = a.length - e >> 1;
						for (c = 0; c < d; c++) {
							h = a.readShort() + b;
							if (h < -32768)
								h += 65536;
							else if (h > 32767)
								h -= 65536;
							this.data[c] = h * 3051758e-11;
							b = h
						}
					}
					g = e + length;
					if (!this.loopMode) {
						this.data[this.length] = 0
					} else {
						this.length = this.loopStart + this.loopLen;
						if (this.loopMode == 1) {
							this.data[d] = this.data[this.loopStart]
						} else {
							this.data[d] = this.data[d - 1]
						}
					}
					if (d != this.length) {
						f = this.data[d - 1];
						for (c = d; c < this.length; c++)
							this.data[c] = f
					}
					if (g < a.length)
						a.position = g;
					else
						a.position = a.length - 1
				}
			}
		})
	}
	function o() {
		var a = c();
		Object
				.defineProperties(
						a,
						{
							setup : {
								value : function(a) {
									var b = 1;
									this.channels.length = a;
									this.channels[0] = m();
									for (; b < a; ++b)
										this.channels[b] = this.channels[b - 1].next = m()
								}
							},
							initialize : {
								value : function() {
									this.reset()
								}
							},
							fast : {
								value : function(a) {
									var b, c, d, e, f = 0, g, h = 0, i, j, k, l = this.bufferSize, m, n;
									if (this.completed) {
										if (!this.remains) {
											this.player.stop();
											return
										}
										l = this.remains
									}
									while (f < l) {
										if (!this.samplesLeft) {
											this.player.process();
											this.player.fast();
											this.samplesLeft = this.samplesTick;
											if (this.completed) {
												l = f + this.samplesTick;
												if (l > this.bufferSize) {
													this.remains = l
															- this.bufferSize;
													l = this.bufferSize
												}
											}
										}
										m = this.samplesLeft;
										if (f + m >= l)
											m = l - f;
										g = h + m;
										b = this.channels[0];
										while (b) {
											if (!b.enabled) {
												b = b.next;
												continue
											}
											j = b.sample;
											c = j.data;
											k = this.buffer[h];
											for (e = h; e < g; ++e) {
												if (b.index != b.pointer) {
													if (b.index >= b.length) {
														if (!j.loopMode) {
															b.enabled = 0;
															break
														} else {
															b.pointer = j.loopStart
																	+ (b.index - b.length);
															b.length = j.length;
															if (j.loopMode == 2) {
																if (!b.dir) {
																	b.dir = j.length
																			+ j.loopStart
																			- 1
																} else {
																	b.dir = 0
																}
															}
														}
													} else
														b.pointer = b.index;
													if (!b.mute) {
														if (!b.dir)
															n = c[b.pointer];
														else
															n = c[b.dir
																	- b.pointer];
														b.ldata = n * b.lvol;
														b.rdata = n * b.rvol
													} else {
														b.ldata = 0;
														b.rdata = 0
													}
												}
												b.index = b.pointer + b.delta;
												if ((b.fraction += b.speed) >= 1) {
													b.index++;
													b.fraction--
												}
												k.l += b.ldata;
												k.r += b.rdata;
												k = k.next
											}
											b = b.next
										}
										h = g;
										f += m;
										this.samplesLeft -= m
									}
									k = this.buffer[0];
									d = a.outputBuffer.getChannelData(0);
									i = a.outputBuffer.getChannelData(1);
									for (e = 0; e < l; ++e) {
										if (k.l > 1)
											k.l = 1;
										else if (k.l < -1)
											k.l = -1;
										if (k.r > 1)
											k.r = 1;
										else if (k.r < -1)
											k.r = -1;
										d[e] = k.l;
										i[e] = k.r;
										k.l = k.r = 0;
										k = k.next
									}
								}
							},
							accurate : {
								value : function(a) {
									var b, c, d, e, f, g, h = 0, i, j = 0, k, l, m, n, o, p = this.bufferSize, q, r;
									if (this.completed) {
										if (!this.remains) {
											this.player.stop();
											return
										}
										p = this.remains
									}
									while (h < p) {
										if (!this.samplesLeft) {
											this.player.process();
											this.player.accurate();
											this.samplesLeft = this.samplesTick;
											if (this.completed) {
												p = h + this.samplesTick;
												if (p > this.bufferSize) {
													this.remains = p
															- this.bufferSize;
													p = this.bufferSize
												}
											}
										}
										q = this.samplesLeft;
										if (h + q >= p)
											q = p - h;
										i = j + q;
										b = this.channels[0];
										while (b) {
											if (!b.enabled) {
												b = b.next;
												continue
											}
											m = b.sample;
											c = m.data;
											n = b.oldSample;
											if (n)
												d = n.data;
											o = this.buffer[j];
											for (g = j; g < i; ++g) {
												r = b.mute ? 0 : c[b.pointer];
												r += (c[b.pointer + b.dir] - r)
														* b.fraction;
												if ((b.fraction += b.speed) >= 1) {
													f = b.fraction >> 0;
													b.fraction -= f;
													if (b.dir > 0) {
														b.pointer += f;
														if (b.pointer > b.length) {
															b.fraction += b.pointer
																	- b.length;
															b.pointer = b.length
														}
													} else {
														b.pointer -= f;
														if (b.pointer < b.length) {
															b.fraction += b.length
																	- b.pointer;
															b.pointer = b.length
														}
													}
												}
												if (!b.mixCounter) {
													o.l += r * b.lvol;
													o.r += r * b.rvol;
													if (b.volCounter) {
														b.lvol += b.lvolDelta;
														b.rvol += b.rvolDelta;
														b.volCounter--
													} else if (b.panCounter) {
														b.lpan += b.lpanDelta;
														b.rpan += b.rpanDelta;
														b.panCounter--;
														b.lvol = b.volume
																* b.lpan;
														b.rvol = b.volume
																* b.rpan
													}
												} else {
													if (n) {
														k = b.mute ? 0
																: d[b.oldPointer];
														k += (d[b.oldPointer
																+ b.oldDir] - k)
																* b.oldFraction;
														if ((b.oldFraction += b.oldSpeed) > 1) {
															f = b.oldFraction >> 0;
															b.oldFraction -= f;
															if (b.oldDir > 0) {
																b.oldPointer += f;
																if (b.oldPointer > b.oldLength) {
																	b.oldFraction += b.oldPointer
																			- b.oldLength;
																	b.oldPointer = b.oldLength
																}
															} else {
																b.oldPointer -= f;
																if (b.oldPointer < b.oldLength) {
																	b.oldFraction += b.oldLength
																			- b.oldPointer;
																	b.oldPointer = b.oldLength
																}
															}
														}
														o.l += r * b.lmixRampU
																+ k
																* b.lmixRampD;
														o.r += r * b.rmixRampU
																+ k
																* b.rmixRampD;
														b.lmixRampD -= b.lmixDeltaD;
														b.rmixRampD -= b.rmixDeltaD
													} else {
														o.l += r * b.lmixRampU;
														o.r += r * b.rmixRampU
													}
													b.lmixRampU += b.lmixDeltaU;
													b.rmixRampU += b.rmixDeltaU;
													b.mixCounter--;
													if (b.oldPointer == b.oldLength) {
														if (!n.loopMode) {
															n = null;
															b.oldPointer = 0
														} else if (n.loopMode == 1) {
															b.oldPointer = n.loopStart;
															b.oldLength = n.length
														} else {
															if (b.oldDir > 0) {
																b.oldPointer = n.length - 1;
																b.oldLength = n.loopStart;
																b.oldDir = -1
															} else {
																b.oldFraction -= 1;
																b.oldPointer = n.loopStart;
																b.oldLength = n.length;
																b.oldDir = 1
															}
														}
													}
												}
												if (b.pointer == b.length) {
													if (!m.loopMode) {
														b.enabled = 0;
														break
													} else if (m.loopMode == 1) {
														b.pointer = m.loopStart;
														b.length = m.length
													} else {
														if (b.dir > 0) {
															b.pointer = m.length - 1;
															b.length = m.loopStart;
															b.dir = -1
														} else {
															b.fraction -= 1;
															b.pointer = m.loopStart;
															b.length = m.length;
															b.dir = 1
														}
													}
												}
												o = o.next
											}
											b = b.next
										}
										j = i;
										h += q;
										this.samplesLeft -= q
									}
									o = this.buffer[0];
									e = a.outputBuffer.getChannelData(0);
									l = a.outputBuffer.getChannelData(1);
									for (g = 0; g < p; ++g) {
										if (o.l > 1)
											o.l = 1;
										else if (o.l < -1)
											o.l = -1;
										if (o.r > 1)
											o.r = 1;
										else if (o.r < -1)
											o.r = -1;
										e[g] = o.l;
										l[g] = o.r;
										o.l = o.r = 0;
										o = o.next
									}
								}
							}
						});
		a.bufferSize = 8192;
		return Object.seal(a)
	}
	function p(a) {
		var b = d();
		Object.defineProperties(b, {
			track : {
				value : null,
				writable : true
			},
			length : {
				value : 0,
				writable : true
			},
			restart : {
				value : 0,
				writable : true
			},
			timer : {
				value : 0,
				writable : true
			},
			master : {
				value : 0,
				writable : true
			},
			volume : {
				set : function(a) {
					if (a < 0)
						a = 0;
					else if (a > 1)
						a = 1;
					this.master = a * 64
				}
			},
			setup : {
				configurable : false,
				value : function() {
					this.mixer.setup(this.channels)
				}
			}
		});
		b.mixer = a || o();
		b.mixer.player = b;
		b.endian = 1;
		b.quality = 1;
		return b
	}
	"use strict";
	window.neoart = Object.create(null);
	window.neoart.Unzip = 1;
	(function() {
		function b() {
			var b = Object
					.create(
							null,
							{
								player : {
									value : null,
									writable : true
								},
								index : {
									value : 0,
									writable : true
								},
								amiga : {
									value : null,
									writable : true
								},
								mixer : {
									value : null,
									writable : true
								},
								tracker : {
									get : function() {
										return this.player ? t[this.index
												+ this.player.version] : t[0]
									}
								},
								load : {
									value : function(b) {
										var k, t, u;
										if (!b.view)
											b = a(b);
										b.endian = 1;
										b.position = 0;
										if (b.readUint() == 67324752) {
											if (window.neoart.Unzip) {
												k = e(b);
												b = k.uncompress(k.entries[0])
											} else {
												throw "Unzip support is not available."
											}
										}
										if (!b)
											return null;
										if (this.player
												&& this.player.id != "STPlayer") {
											this.player.load(b);
											if (this.player.version)
												return player
										}
										if (b.length > 336) {
											b.position = 38;
											t = b.readString(20);
											if (t == "FastTracker v2.00   "
													|| t == "FastTracker v 2.00  "
													|| t == "Sk@le Tracker"
													|| t == "MadTracker 2.0"
													|| t == "MilkyTracker        "
													|| t == "DigiBooster Pro 2.18"
													|| t.indexOf("OpenMPT") != -1) {
												this.player = window.neoart
														.F2Player(this.mixer);
												this.player.load(b);
												if (this.player.version) {
													this.index = s;
													return this.player
												}
											}
										}
										b.endian = 0;
										if (b.length > 2105) {
											b.position = 1080;
											t = b.readString(4);
											if (t == "M.K." || t == "FLT4") {
												this.player = window.neoart
														.MKPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = d;
													return this.player
												}
											} else if (t == "FEST") {
												this.player = window.neoart
														.HMPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = g;
													return this.player
												}
											}
										}
										if (b.length > 2105) {
											b.position = 1080;
											t = b.readString(4);
											if (t == "M.K." || t == "M!K!") {
												this.player = window.neoart
														.PTPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = f;
													return this.player
												}
											}
										}
										if (b.length > 1685) {
											b.position = 60;
											t = b.readString(4);
											if (t != "SONG") {
												b.position = 124;
												t = b.readString(4)
											}
											if (t == "SONG" || t == "SO31") {
												this.player = window.neoart
														.FXPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = h;
													return this.player
												}
											}
										}
										if (b.length > 4) {
											b.position = 0;
											t = b.readString(4);
											if (t == "ALL ") {
												this.player = window.neoart
														.D1Player(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = j;
													return this.player
												}
											}
										}
										if (b.length > 3018) {
											b.position = 3014;
											t = b.readString(4);
											if (t == ".FNL") {
												this.player = window.neoart
														.D2Player(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = j;
													return this.player
												}
											}
										}
										if (b.length > 30) {
											b.position = 26;
											t = b.readString(3);
											if (t == "BPS" || t == "V.2"
													|| t == "V.3") {
												this.player = window.neoart
														.BPPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = i;
													return this.player
												}
											}
										}
										if (b.length > 4) {
											b.position = 0;
											t = b.readString(4);
											if (t == "SMOD" || t == "FC14") {
												this.player = window.neoart
														.FCPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = m;
													return this.player
												}
											}
										}
										if (b.length > 10) {
											b.position = 0;
											t = b.readString(9);
											if (t == " MUGICIAN") {
												this.player = window.neoart
														.DMPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = l;
													return this.player
												}
											}
										}
										if (b.length > 86) {
											b.position = 58;
											t = b.readString(28);
											if (t == "SIDMON II - THE MIDI VERSION") {
												this.player = window.neoart
														.S2Player(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = n;
													return this.player
												}
											}
										}
										if (b.length > 2830) {
											b.position = 0;
											u = b.readUshort();
											if (u == 20218) {
												this.player = window.neoart
														.FEPlayer(this.amiga);
												this.player.load(b);
												if (this.player.version) {
													this.index = p;
													return this.player
												}
											}
										}
										if (b.length > 5220) {
											this.player = window.neoart
													.S1Player(this.amiga);
											this.player.load(b);
											if (this.player.version) {
												this.index = n;
												return this.player
											}
										}
										b.position = 0;
										u = b.readUshort();
										b.position = 0;
										t = b.readString(4);
										if (t == "COSO" || u == 24576
												|| u == 24578 || u == 24590
												|| u == 24598) {
											this.player = window.neoart
													.JHPlayer(this.amiga);
											this.player.load(b);
											if (this.player.version) {
												this.index = q;
												return this.player
											}
										}
										b.position = 0;
										u = b.readUshort();
										this.player = window.neoart
												.DWPlayer(this.amiga);
										this.player.load(b);
										if (this.player.version) {
											this.index = o;
											return this.player
										}
										b.position = 0;
										u = b.readUshort();
										if (u == 24576) {
											this.player = window.neoart
													.RHPlayer(this.amiga);
											this.player.load(b);
											if (this.player.version) {
												this.index = r;
												return this.player
											}
										}
										if (b.length > 1625) {
											this.player = window.neoart
													.STPlayer(this.amiga);
											this.player.load(b);
											if (this.player.version) {
												this.index = c;
												return this.player
											}
										}
										b.clear();
										this.index = 0;
										return this.player = null
									}
								}
							});
			b.amiga = k();
			return Object.seal(b)
		}
		var c = 0, d = 4, f = 9, g = 12, h = 13, i = 17, j = 20, l = 22, m = 24, n = 26, o = 28, p = 29, q = 30, r = 32, s = 33, t = [
				"Unknown Format", "Ultimate SoundTracker",
				"D.O.C. SoundTracker 9", "Master SoundTracker",
				"D.O.C. SoundTracker 2.0/2.2", "SoundTracker 2.3",
				"SoundTracker 2.4", "NoiseTracker 1.0", "NoiseTracker 1.1",
				"NoiseTracker 2.0", "ProTracker 1.0", "ProTracker 1.1/2.1",
				"ProTracker 1.2/2.0", "His Master's NoiseTracker",
				"SoundFX 1.0/1.7", "SoundFX 1.8", "SoundFX 1.945",
				"SoundFX 1.994/2.0", "BP SoundMon V1", "BP SoundMon V2",
				"BP SoundMon V3", "Delta Music 1.0", "Delta Music 2.0",
				"Digital Mugician", "Digital Mugician 7 Voices",
				"Future Composer 1.0/1.3", "Future Composer 1.4", "SidMon 1.0",
				"SidMon 2.0", "David Whittaker", "FredEd", "Jochen Hippel",
				"Jochen Hippel COSO", "Rob Hubbard", "FastTracker II",
				"Sk@leTracker", "MadTracker 2.0", "MilkyTracker",
				"DigiBooster Pro 2.18", "OpenMPT" ];
		window.neoart.FileLoader = b()
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				restart : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				sample : {
					value : 0,
					writable : true
				},
				samplePtr : {
					value : 0,
					writable : true
				},
				sampleLen : {
					value : 0,
					writable : true
				},
				synth : {
					value : 0,
					writable : true
				},
				synthPtr : {
					value : 0,
					writable : true
				},
				arpeggio : {
					value : 0,
					writable : true
				},
				autoArpeggio : {
					value : 0,
					writable : true
				},
				autoSlide : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				volumeDef : {
					value : 0,
					writable : true
				},
				adsrControl : {
					value : 0,
					writable : true
				},
				adsrPtr : {
					value : 0,
					writable : true
				},
				adsrCtr : {
					value : 0,
					writable : true
				},
				lfoControl : {
					value : 0,
					writable : true
				},
				lfoPtr : {
					value : 0,
					writable : true
				},
				lfoCtr : {
					value : 0,
					writable : true
				},
				egControl : {
					value : 0,
					writable : true
				},
				egPtr : {
					value : 0,
					writable : true
				},
				egCtr : {
					value : 0,
					writable : true
				},
				egValue : {
					value : 0,
					writable : true
				},
				fxControl : {
					value : 0,
					writable : true
				},
				fxCtr : {
					value : 0,
					writable : true
				},
				modControl : {
					value : 0,
					writable : true
				},
				modPtr : {
					value : 0,
					writable : true
				},
				modCtr : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null, this.enabled = 0;
						this.restart = 0;
						this.note = 0;
						this.period = 0;
						this.sample = 0;
						this.samplePtr = 0;
						this.sampleLen = 2;
						this.synth = 0;
						this.synthPtr = -1;
						this.arpeggio = 0;
						this.autoArpeggio = 0;
						this.autoSlide = 0;
						this.vibrato = 0;
						this.volume = 0;
						this.volumeDef = 0;
						this.adsrControl = 0;
						this.adsrPtr = 0;
						this.adsrCtr = 0;
						this.lfoControl = 0;
						this.lfoPtr = 0;
						this.lfoCtr = 0;
						this.egControl = 0;
						this.egPtr = 0;
						this.egCtr = 0;
						this.egValue = 0;
						this.fxControl = 0;
						this.fxCtr = 0;
						this.modControl = 0;
						this.modPtr = 0;
						this.modCtr = 0
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				synth : {
					value : 0,
					writable : true
				},
				table : {
					value : 0,
					writable : true
				},
				adsrControl : {
					value : 0,
					writable : true
				},
				adsrTable : {
					value : 0,
					writable : true
				},
				adsrLen : {
					value : 0,
					writable : true
				},
				adsrSpeed : {
					value : 0,
					writable : true
				},
				lfoControl : {
					value : 0,
					writable : true
				},
				lfoTable : {
					value : 0,
					writable : true
				},
				lfoDepth : {
					value : 0,
					writable : true
				},
				lfoLen : {
					value : 0,
					writable : true
				},
				lfoDelay : {
					value : 0,
					writable : true
				},
				lfoSpeed : {
					value : 0,
					writable : true
				},
				egControl : {
					value : 0,
					writable : true
				},
				egTable : {
					value : 0,
					writable : true
				},
				egLen : {
					value : 0,
					writable : true
				},
				egDelay : {
					value : 0,
					writable : true
				},
				egSpeed : {
					value : 0,
					writable : true
				},
				fxControl : {
					value : 0,
					writable : true
				},
				fxDelay : {
					value : 0,
					writable : true
				},
				fxSpeed : {
					value : 0,
					writable : true
				},
				modControl : {
					value : 0,
					writable : true
				},
				modTable : {
					value : 0,
					writable : true
				},
				modLen : {
					value : 0,
					writable : true
				},
				modDelay : {
					value : 0,
					writable : true
				},
				modSpeed : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c() {
			var a = j();
			Object.defineProperties(a, {
				soundTranspose : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function d(d) {
			var i = l(d);
			Object
					.defineProperties(
							i,
							{
								id : {
									value : "BPPlayer"
								},
								tracks : {
									value : [],
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								buffer : {
									value : null,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								nextPos : {
									value : 0,
									writable : true
								},
								jumpFlag : {
									value : 0,
									writable : true
								},
								repeatCtr : {
									value : 0,
									writable : true
								},
								arpeggioCtr : {
									value : 0,
									writable : true
								},
								vibratoPos : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a, b, c, d = this.voices[0];
										this.reset();
										this.speed = 6;
										this.tick = 1;
										this.trackPos = 0;
										this.patternPos = 0;
										this.nextPos = 0;
										this.jumpFlag = 0;
										this.repeatCtr = 0;
										this.arpeggioCtr = 1;
										this.vibratoPos = 0;
										for (a = 0; a < 128; ++a)
											this.buffer[a] = 0;
										while (d) {
											d.initialize();
											d.channel = this.mixer.channels[d.index];
											d.samplePtr = this.mixer.loopPtr;
											d = d.next
										}
									}
								},
								restore : {
									value : function() {
										var a, b, c, d = this.voices[0];
										while (d) {
											if (d.synthPtr > -1) {
												c = d.index << 5;
												b = d.synthPtr + 32;
												for (a = d.synthPtr; a < b; ++a)
													this.mixer.memory[a] = this.buffer[c++]
											}
											d = d.next
										}
									}
								},
								loader : {
									value : function(a) {
										var d = 0, i = 0, j, k, l, m, n, o;
										this.title = a.readString(26);
										j = a.readString(4);
										if (j == "BPSM") {
											this.version = e
										} else {
											j = j.substr(0, 3);
											if (j == "V.2")
												this.version = f;
											else if (j == "V.3")
												this.version = g;
											else
												return;
											a.position = 29;
											o = a.readUbyte()
										}
										this.length = a.readUshort();
										for (; ++i < 16;) {
											m = b();
											if (a.readUbyte() == 255) {
												m.synth = 1;
												m.table = a.readUbyte();
												m.pointer = m.table << 6;
												m.length = a.readUshort() << 1;
												m.adsrControl = a.readUbyte();
												m.adsrTable = a.readUbyte() << 6;
												m.adsrLen = a.readUshort();
												m.adsrSpeed = a.readUbyte();
												m.lfoControl = a.readUbyte();
												m.lfoTable = a.readUbyte() << 6;
												m.lfoDepth = a.readUbyte();
												m.lfoLen = a.readUshort();
												if (this.version < g) {
													a.readByte();
													m.lfoDelay = a.readUbyte();
													m.lfoSpeed = a.readUbyte();
													m.egControl = a.readUbyte();
													m.egTable = a.readUbyte() << 6;
													a.readByte();
													m.egLen = a.readUshort();
													a.readByte();
													m.egDelay = a.readUbyte();
													m.egSpeed = a.readUbyte();
													m.fxSpeed = 1;
													m.modSpeed = 1;
													m.volume = a.readUbyte();
													a.position += 6
												} else {
													m.lfoDelay = a.readUbyte();
													m.lfoSpeed = a.readUbyte();
													m.egControl = a.readUbyte();
													m.egTable = a.readUbyte() << 6;
													m.egLen = a.readUshort();
													m.egDelay = a.readUbyte();
													m.egSpeed = a.readUbyte();
													m.fxControl = a.readUbyte();
													m.fxSpeed = a.readUbyte();
													m.fxDelay = a.readUbyte();
													m.modControl = a
															.readUbyte();
													m.modTable = a.readUbyte() << 6;
													m.modSpeed = a.readUbyte();
													m.modDelay = a.readUbyte();
													m.volume = a.readUbyte();
													m.modLen = a.readUshort()
												}
											} else {
												a.position--;
												m.synth = 0;
												m.name = a.readString(24);
												m.length = a.readUshort() << 1;
												if (m.length) {
													m.loop = a.readUshort();
													m.repeat = a.readUshort() << 1;
													m.volume = a.readUshort();
													if (m.loop + m.repeat >= m.length)
														m.repeat = m.length
																- m.loop
												} else {
													m.pointer--;
													m.repeat = 2;
													a.position += 6
												}
											}
											this.samples[i] = m
										}
										k = this.length << 2;
										this.tracks.length = k;
										for (i = 0; i < k; ++i) {
											n = c();
											n.pattern = a.readUshort();
											n.soundTranspose = a.readByte();
											n.transpose = a.readByte();
											if (n.pattern > d)
												d = n.pattern;
											this.tracks[i] = n
										}
										k = d << 4;
										this.patterns.length = k;
										for (i = 0; i < k; ++i) {
											l = h();
											l.note = a.readByte();
											l.sample = a.readUbyte();
											l.effect = l.sample & 15;
											l.sample = (l.sample & 240) >> 4;
											l.param = a.readByte();
											this.patterns[i] = l
										}
										this.mixer.store(a, o << 6);
										for (i = 0; ++i < 16;) {
											m = this.samples[i];
											if (m.synth || !m.length)
												continue;
											m.pointer = this.mixer.store(a,
													m.length);
											m.loopPtr = m.pointer + m.loop
										}
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, f = this.mixer.memory, h, i, j, l, n, o, p = this.voices[0];
										this.arpeggioCtr = --this.arpeggioCtr & 3;
										this.vibratoPos = ++this.vibratoPos & 7;
										while (p) {
											a = p.channel;
											p.period += p.autoSlide;
											if (p.vibrato)
												a.period = p.period
														+ (m[this.vibratoPos]
																/ p.vibrato >> 0);
											else
												a.period = p.period;
											a.pointer = p.samplePtr;
											a.length = p.sampleLen;
											if (p.arpeggio || p.autoArpeggio) {
												h = p.note;
												if (!this.arpeggioCtr)
													h += ((p.arpeggio & 240) >> 4)
															+ ((p.autoArpeggio & 240) >> 4);
												else if (this.arpeggioCtr == 1)
													h += (p.arpeggio & 15)
															+ (p.autoArpeggio & 15);
												a.period = p.period = k[h + 35];
												p.restart = 0
											}
											if (!p.synth || p.sample < 0) {
												p = p.next;
												continue
											}
											l = this.samples[p.sample];
											if (p.adsrControl) {
												if (--p.adsrCtr == 0) {
													p.adsrCtr = l.adsrSpeed;
													b = 128 + f[l.adsrTable
															+ p.adsrPtr] >> 2;
													a.volume = b * p.volume >> 6;
													if (++p.adsrPtr == l.adsrLen) {
														p.adsrPtr = 0;
														if (p.adsrControl == 1)
															p.adsrControl = 0
													}
												}
											}
											if (p.lfoControl) {
												if (--p.lfoCtr == 0) {
													p.lfoCtr = l.lfoSpeed;
													b = f[l.lfoTable + p.lfoPtr];
													if (l.lfoDepth)
														b = b / l.lfoDepth >> 0;
													a.period = p.period + b;
													if (++p.lfoPtr == l.lfoLen) {
														p.lfoPtr = 0;
														if (p.lfoControl == 1)
															p.lfoControl = 0
													}
												}
											}
											if (p.synthPtr < 0) {
												p = p.next;
												continue
											}
											if (p.egControl) {
												if (--p.egCtr == 0) {
													p.egCtr = l.egSpeed;
													b = p.egValue;
													p.egValue = 128 + f[l.egTable
															+ p.egPtr] >> 3;
													if (p.egValue != b) {
														n = (p.index << 5) + b;
														c = p.synthPtr + b;
														if (p.egValue < b) {
															b -= p.egValue;
															e = c - b;
															for (; c > e;)
																f[--c] = this.buffer[--n]
														} else {
															b = p.egValue - b;
															e = c + b;
															for (; c < e;)
																f[c++] = ~this.buffer[n++] + 1
														}
													}
													if (++p.egPtr == l.egLen) {
														p.egPtr = 0;
														if (p.egControl == 1)
															p.egControl = 0
													}
												}
											}
											switch (p.fxControl) {
											case 0:
												break;
											case 1:
												if (--p.fxCtr == 0) {
													p.fxCtr = l.fxSpeed;
													c = p.synthPtr;
													e = p.synthPtr + 32;
													b = c > 0 ? f[c - 1] : 0;
													for (; c < e;) {
														b = b + f[c + 1] >> 1;
														f[c++] = b
													}
												}
												break;
											case 2:
												n = (p.index << 5) + 31;
												e = p.synthPtr + 32;
												b = l.fxSpeed;
												for (c = p.synthPtr; c < e; ++c) {
													if (this.buffer[n] < f[c]) {
														f[c] -= b
													} else if (this.buffer[n] > f[c]) {
														f[c] += b
													}
													n--
												}
												break;
											case 3:
											case 5:
												n = p.index << 5;
												e = p.synthPtr + 32;
												b = l.fxSpeed;
												for (c = p.synthPtr; c < e; ++c) {
													if (this.buffer[n] < f[c]) {
														f[c] -= b
													} else if (this.buffer[n] > f[c]) {
														f[c] += b
													}
													n++
												}
												break;
											case 4:
												n = p.synthPtr + 64;
												e = p.synthPtr + 32;
												b = l.fxSpeed;
												for (c = p.synthPtr; c < e; ++c) {
													if (f[n] < f[c]) {
														f[c] -= b
													} else if (f[n] > f[c]) {
														f[c] += b
													}
													n++
												}
												break;
											case 6:
												if (--p.fxCtr == 0) {
													p.fxControl = 0;
													p.fxCtr = 1;
													n = p.synthPtr + 64;
													e = p.synthPtr + 32;
													for (c = p.synthPtr; c < e; ++c)
														f[c] = f[n++]
												}
												break
											}
											if (p.modControl) {
												if (--p.modCtr == 0) {
													p.modCtr = l.modSpeed;
													f[p.synthPtr + 32] = f[l.modTable
															+ p.modPtr];
													if (++p.modPtr == l.modLen) {
														p.modPtr = 0;
														if (p.modControl == 1)
															p.modControl = 0
													}
												}
											}
											p = p.next
										}
										if (--this.tick == 0) {
											this.tick = this.speed;
											p = this.voices[0];
											while (p) {
												a = p.channel;
												p.enabled = 0;
												o = this.tracks[(this.trackPos << 2)
														+ p.index];
												j = this.patterns[this.patternPos
														+ (o.pattern - 1 << 4)];
												h = j.note;
												i = j.effect;
												b = j.param;
												if (h) {
													p.autoArpeggio = p.autoSlide = p.vibrato = 0;
													if (i != 10
															|| (b & 240) == 0)
														h += o.transpose;
													p.note = h;
													p.period = k[h + 35];
													if (i < 13)
														p.restart = p.volumeDef = 1;
													else
														p.restart = 0;
													d = j.sample;
													if (d == 0)
														d = p.sample;
													if (i != 10
															|| (b & 15) == 0)
														d += o.soundTranspose;
													if (i < 13
															&& (!p.synth || p.sample != d)) {
														p.sample = d;
														p.enabled = 1
													}
												}
												switch (i) {
												case 0:
													p.arpeggio = b;
													break;
												case 1:
													p.volume = b;
													p.volumeDef = 0;
													if (this.version < g
															|| !p.synth)
														a.volume = p.volume;
													break;
												case 2:
													this.tick = this.speed = b;
													break;
												case 3:
													this.mixer.filter.active = b;
													break;
												case 4:
													p.period -= b;
													p.arpeggio = 0;
													break;
												case 5:
													p.period += b;
													p.arpeggio = 0;
													break;
												case 6:
													if (this.version == g)
														p.vibrato = b;
													else
														this.repeatCtr = b;
													break;
												case 7:
													if (this.version == g) {
														this.nextPos = b;
														this.jumpFlag = 1
													} else if (this.repeatCtr == 0) {
														this.trackPos = b
													}
													break;
												case 8:
													p.autoSlide = b;
													break;
												case 9:
													p.autoArpeggio = b;
													if (this.version == g) {
														p.adsrPtr = 0;
														if (p.adsrControl == 0)
															p.adsrControl = 1
													}
													break;
												case 11:
													p.fxControl = b;
													break;
												case 13:
													p.autoArpeggio = b;
													p.fxControl ^= 1;
													p.adsrPtr = 0;
													if (p.adsrControl == 0)
														p.adsrControl = 1;
													break;
												case 14:
													p.autoArpeggio = b;
													p.adsrPtr = 0;
													if (p.adsrControl == 0)
														p.adsrControl = 1;
													break;
												case 15:
													p.autoArpeggio = b;
													break
												}
												p = p.next
											}
											if (this.jumpFlag) {
												this.trackPos = this.nextPos;
												this.patternPos = this.jumpFlag = 0
											} else if (++this.patternPos == 16) {
												this.patternPos = 0;
												if (++this.trackPos == this.length) {
													this.trackPos = 0;
													this.mixer.complete = 1
												}
											}
											p = this.voices[0];
											while (p) {
												a = p.channel;
												if (p.enabled)
													a.enabled = p.enabled = 0;
												if (p.restart == 0) {
													p = p.next;
													continue
												}
												if (p.synthPtr > -1) {
													n = p.index << 5;
													e = p.synthPtr + 32;
													for (c = p.synthPtr; c < e; ++c)
														f[c] = this.buffer[n++];
													p.synthPtr = -1
												}
												p = p.next
											}
											p = this.voices[0];
											while (p) {
												if (p.restart == 0
														|| p.sample < 0) {
													p = p.next;
													continue
												}
												a = p.channel;
												a.period = p.period;
												p.restart = 0;
												l = this.samples[p.sample];
												if (l.synth) {
													p.synth = 1;
													p.egValue = 0;
													p.adsrPtr = p.lfoPtr = p.egPtr = p.modPtr = 0;
													p.adsrCtr = 1;
													p.lfoCtr = l.lfoDelay + 1;
													p.egCtr = l.egDelay + 1;
													p.fxCtr = l.fxDelay + 1;
													p.modCtr = l.modDelay + 1;
													p.adsrControl = l.adsrControl;
													p.lfoControl = l.lfoControl;
													p.egControl = l.egControl;
													p.fxControl = l.fxControl;
													p.modControl = l.modControl;
													a.pointer = p.samplePtr = l.pointer;
													a.length = p.sampleLen = l.length;
													if (p.adsrControl) {
														b = 128 + f[l.adsrTable] >> 2;
														if (p.volumeDef) {
															p.volume = l.volume;
															p.volumeDef = 0
														}
														a.volume = b * p.volume >> 6
													} else {
														a.volume = p.volumeDef ? l.volume
																: p.volume
													}
													if (p.egControl
															|| p.fxControl
															|| p.modControl) {
														p.synthPtr = l.pointer;
														c = p.index << 5;
														e = p.synthPtr + 32;
														for (n = p.synthPtr; n < e; ++n)
															this.buffer[c++] = f[n]
													}
												} else {
													p.synth = p.lfoControl = 0;
													if (l.pointer < 0) {
														p.samplePtr = this.mixer.loopPtr;
														p.sampleLen = 2
													} else {
														a.pointer = l.pointer;
														a.volume = p.volumeDef ? l.volume
																: p.volume;
														if (l.repeat != 2) {
															p.samplePtr = l.loopPtr;
															a.length = p.sampleLen = l.repeat
														} else {
															p.samplePtr = this.mixer.loopPtr;
															p.sampleLen = 2;
															a.length = l.length
														}
													}
												}
												a.enabled = p.enabled = 1;
												p = p.next
											}
										}
									}
								}
							});
			i.voices[0] = a(0);
			i.voices[0].next = i.voices[1] = a(1);
			i.voices[1].next = i.voices[2] = a(2);
			i.voices[2].next = i.voices[3] = a(3);
			i.buffer = new Int8Array(128);
			return Object.seal(i)
		}
		var e = 1, f = 2, g = 3, k = [ 6848, 6464, 6080, 5760, 5440, 5120,
				4832, 4576, 4320, 4064, 3840, 3616, 3424, 3232, 3040, 2880,
				2720, 2560, 2416, 2288, 2160, 2032, 1920, 1808, 1712, 1616,
				1520, 1440, 1360, 1280, 1208, 1144, 1080, 1016, 960, 904, 856,
				808, 760, 720, 680, 640, 604, 572, 540, 508, 480, 452, 428,
				404, 380, 360, 340, 320, 302, 286, 270, 254, 240, 226, 214,
				202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113, 107,
				101, 95, 90, 85, 80, 76, 72, 68, 64, 60, 57 ], m = [ 0, 64,
				128, 64, 0, -64, -128, -64 ];
		window.neoart.BPPlayer = d
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				status : {
					value : 0,
					writable : true
				},
				speed : {
					value : 0,
					writable : true
				},
				step : {
					value : null,
					writable : true
				},
				row : {
					value : null,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				arpeggioPos : {
					value : 0,
					writable : true
				},
				pitchBend : {
					value : 0,
					writable : true
				},
				tableCtr : {
					value : 0,
					writable : true
				},
				tablePos : {
					value : 0,
					writable : true
				},
				vibratoCtr : {
					value : 0,
					writable : true
				},
				vibratoDir : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				vibratoPeriod : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				attackCtr : {
					value : 0,
					writable : true
				},
				decayCtr : {
					value : 0,
					writable : true
				},
				releaseCtr : {
					value : 0,
					writable : true
				},
				sustain : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.sample = null;
						this.trackPos = 0;
						this.patternPos = 0;
						this.status = 0;
						this.speed = 1;
						this.step = null;
						this.row = null;
						this.note = 0;
						this.period = 0;
						this.arpeggioPos = 0;
						this.pitchBend = 0;
						this.tableCtr = 0;
						this.tablePos = 0;
						this.vibratoCtr = 0;
						this.vibratoDir = 0;
						this.vibratoPos = 0;
						this.vibratoPeriod = 0;
						this.volume = 0;
						this.attackCtr = 0;
						this.decayCtr = 0;
						this.releaseCtr = 0;
						this.sustain = 1
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				synth : {
					value : 0,
					writable : true
				},
				attackStep : {
					value : 0,
					writable : true
				},
				attackDelay : {
					value : 0,
					writable : true
				},
				decayStep : {
					value : 0,
					writable : true
				},
				decayDelay : {
					value : 0,
					writable : true
				},
				releaseStep : {
					value : 0,
					writable : true
				},
				releaseDelay : {
					value : 0,
					writable : true
				},
				sustain : {
					value : 0,
					writable : true
				},
				arpeggio : {
					value : null,
					writable : true
				},
				pitchBend : {
					value : 0,
					writable : true
				},
				portamento : {
					value : 0,
					writable : true
				},
				table : {
					value : null,
					writable : true
				},
				tableDelay : {
					value : 0,
					writable : true
				},
				vibratoWait : {
					value : 0,
					writable : true
				},
				vibratoStep : {
					value : 0,
					writable : true
				},
				vibratoLen : {
					value : 0,
					writable : true
				}
			});
			a.arpeggio = new Int8Array(8);
			a.table = new Int8Array(48);
			return Object.seal(a)
		}
		function c(c) {
			var e = l(c);
			Object
					.defineProperties(
							e,
							{
								id : {
									value : "D1Player"
								},
								pointers : {
									value : null,
									writable : true
								},
								tracks : {
									value : [],
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.speed = 6;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.sample = this.samples[20];
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var c, d = 0, e, f, g = 0, i, k, l, m, n, o;
										e = a.readString(4);
										if (e != "ALL ")
											return;
										k = 104;
										c = new Uint32Array(25);
										for (; d < 25; ++d)
											c[d] = a.readUint();
										this.pointers = new Uint32Array(4);
										for (d = 1; d < 4; ++d)
											this.pointers[d] = this.pointers[g]
													+ (c[g++] >> 1) - 1;
										i = this.pointers[3] + (c[3] >> 1) - 1;
										this.tracks.length = i;
										f = k + c[1] - 2;
										a.position = k;
										g = 1;
										for (d = 0; d < i; ++d) {
											n = j();
											o = a.readUshort();
											if (o == 65535 || a.position == f) {
												n.pattern = -1;
												n.transpose = a.readUshort();
												f += c[g++]
											} else {
												a.position--;
												n.pattern = (o >> 2 & 16320) >> 2;
												n.transpose = a.readByte()
											}
											this.tracks[d] = n
										}
										i = c[4] >> 2;
										this.patterns.length = i;
										for (d = 0; d < i; ++d) {
											l = h();
											l.sample = a.readUbyte();
											l.note = a.readUbyte();
											l.effect = a.readUbyte() & 31;
											l.param = a.readUbyte();
											this.patterns[d] = l
										}
										f = 5;
										for (d = 0; d < 20; ++d) {
											this.samples[d] = null;
											if (c[f] != 0) {
												m = b();
												m.attackStep = a.readUbyte();
												m.attackDelay = a.readUbyte();
												m.decayStep = a.readUbyte();
												m.decayDelay = a.readUbyte();
												m.sustain = a.readUshort();
												m.releaseStep = a.readUbyte();
												m.releaseDelay = a.readUbyte();
												m.volume = a.readUbyte();
												m.vibratoWait = a.readUbyte();
												m.vibratoStep = a.readUbyte();
												m.vibratoLen = a.readUbyte();
												m.pitchBend = a.readByte();
												m.portamento = a.readUbyte();
												m.synth = a.readUbyte();
												m.tableDelay = a.readUbyte();
												for (g = 0; g < 8; ++g)
													m.arpeggio[g] = a
															.readByte();
												m.length = a.readUshort();
												m.loop = a.readUshort();
												m.repeat = a.readUshort() << 1;
												m.synth = m.synth ? 0 : 1;
												if (m.synth) {
													for (g = 0; g < 48; ++g)
														m.table[g] = a
																.readByte();
													i = c[f] - 78
												} else {
													i = m.length
												}
												m.pointer = this.mixer.store(a,
														i);
												m.loopPtr = m.pointer + m.loop;
												this.samples[d] = m
											}
											f++
										}
										m = b();
										m.pointer = m.loopPtr = this.mixer.memory.length;
										m.length = m.repeat = 2;
										this.samples[20] = m;
										this.version = 1
									}
								},
								process : {
									value : function() {
										var a, b, c, e, f, g, h = this.voices[0];
										while (h) {
											b = h.channel;
											if (--h.speed == 0) {
												h.speed = this.speed;
												if (h.patternPos == 0) {
													h.step = this.tracks[this.pointers[h.index]
															+ h.trackPos];
													if (h.step.pattern < 0) {
														h.trackPos = h.step.transpose;
														h.step = this.tracks[this.pointers[h.index]
																+ h.trackPos]
													}
													h.trackPos++
												}
												e = this.patterns[h.step.pattern
														+ h.patternPos];
												if (e.effect)
													h.row = e;
												if (e.note) {
													b.enabled = 0;
													h.row = e;
													h.note = e.note
															+ h.step.transpose;
													h.arpeggioPos = h.pitchBend = h.status = 0;
													f = h.sample = this.samples[e.sample];
													if (!f.synth)
														b.pointer = f.pointer;
													b.length = f.length;
													h.tableCtr = h.tablePos = 0;
													h.vibratoCtr = f.vibratoWait;
													h.vibratoPos = f.vibratoLen;
													h.vibratoDir = f.vibratoLen << 1;
													h.volume = h.attackCtr = h.decayCtr = h.releaseCtr = 0;
													h.sustain = f.sustain
												}
												if (++h.patternPos == 16)
													h.patternPos = 0
											}
											f = h.sample;
											if (f.synth) {
												if (h.tableCtr == 0) {
													h.tableCtr = f.tableDelay;
													do {
														c = 1;
														if (h.tablePos >= 48)
															h.tablePos = 0;
														g = f.table[h.tablePos];
														h.tablePos++;
														if (g >= 0) {
															b.pointer = f.pointer
																	+ (g << 5);
															c = 0
														} else if (g != -1) {
															f.tableDelay = g & 127
														} else {
															h.tablePos = f.table[h.tablePos]
														}
													} while (c)
												} else
													h.tableCtr--
											}
											if (f.portamento) {
												g = d[h.note] + h.pitchBend;
												if (h.period != 0) {
													if (h.period < g) {
														h.period += f.portamento;
														if (h.period > g)
															h.period = g
													} else {
														h.period -= f.portamento;
														if (h.period < g)
															h.period = g
													}
												} else
													h.period = g
											}
											if (h.vibratoCtr == 0) {
												h.vibratoPeriod = h.vibratoPos
														* f.vibratoStep;
												if ((h.status & 1) == 0) {
													h.vibratoPos++;
													if (h.vibratoPos == h.vibratoDir)
														h.status ^= 1
												} else {
													h.vibratoPos--;
													if (h.vibratoPos == 0)
														h.status ^= 1
												}
											} else {
												h.vibratoCtr--
											}
											if (f.pitchBend < 0)
												h.pitchBend += f.pitchBend;
											else
												h.pitchBend -= f.pitchBend;
											if (h.row) {
												e = h.row;
												switch (e.effect) {
												case 0:
													break;
												case 1:
													g = e.param & 15;
													if (g)
														this.speed = g;
													break;
												case 2:
													h.pitchBend -= e.param;
													break;
												case 3:
													h.pitchBend += e.param;
													break;
												case 4:
													this.mixer.filter.active = e.param;
													break;
												case 5:
													f.vibratoWait = e.param;
													break;
												case 6:
													f.vibratoStep = e.param;
												case 7:
													f.vibratoLen = e.param;
													break;
												case 8:
													f.pitchBend = e.param;
													break;
												case 9:
													f.portamento = e.param;
													break;
												case 10:
													g = e.param;
													if (g > 64)
														g = 64;
													f.volume = 64;
													break;
												case 11:
													f.arpeggio[0] = e.param;
													break;
												case 12:
													f.arpeggio[1] = e.param;
													break;
												case 13:
													f.arpeggio[2] = e.param;
													break;
												case 14:
													f.arpeggio[3] = e.param;
													break;
												case 15:
													f.arpeggio[4] = e.param;
													break;
												case 16:
													f.arpeggio[5] = e.param;
													break;
												case 17:
													f.arpeggio[6] = e.param;
													break;
												case 18:
													f.arpeggio[7] = e.param;
													break;
												case 19:
													f.arpeggio[0] = f.arpeggio[4] = e.param;
													break;
												case 20:
													f.arpeggio[1] = f.arpeggio[5] = e.param;
													break;
												case 21:
													f.arpeggio[2] = f.arpeggio[6] = e.param;
													break;
												case 22:
													f.arpeggio[3] = f.arpeggio[7] = e.param;
													break;
												case 23:
													g = e.param;
													if (g > 64)
														g = 64;
													f.attackStep = g;
													break;
												case 24:
													f.attackDelay = e.param;
													break;
												case 25:
													g = e.param;
													if (g > 64)
														g = 64;
													f.decayStep = g;
													break;
												case 26:
													f.decayDelay = e.param;
													break;
												case 27:
													f.sustain = e.param
															& (f.sustain & 255);
													break;
												case 28:
													f.sustain = (f.sustain & 65280)
															+ e.param;
													break;
												case 29:
													g = e.param;
													if (g > 64)
														g = 64;
													f.releaseStep = g;
													break;
												case 30:
													f.releaseDelay = e.param;
													break
												}
											}
											if (f.portamento)
												g = h.period;
											else {
												g = d[h.note
														+ f.arpeggio[h.arpeggioPos]];
												h.arpeggioPos = ++h.arpeggioPos & 7;
												g -= f.vibratoLen
														* f.vibratoStep;
												g += h.pitchBend;
												h.period = 0
											}
											b.period = g + h.vibratoPeriod;
											a = h.status & 14;
											g = h.volume;
											if (a == 0) {
												if (h.attackCtr == 0) {
													h.attackCtr = f.attackDelay;
													g += f.attackStep;
													if (g >= 64) {
														a |= 2;
														h.status |= 2;
														g = 64
													}
												} else {
													h.attackCtr--
												}
											}
											if (a == 2) {
												if (h.decayCtr == 0) {
													h.decayCtr = f.decayDelay;
													g -= f.decayStep;
													if (g <= f.volume) {
														a |= 6;
														h.status |= 6;
														g = f.volume
													}
												} else {
													h.decayCtr--
												}
											}
											if (a == 6) {
												if (h.sustain == 0) {
													a |= 14;
													h.status |= 14
												} else {
													h.sustain--
												}
											}
											if (a == 14) {
												if (h.releaseCtr == 0) {
													h.releaseCtr = f.releaseDelay;
													g -= f.releaseStep;
													if (g < 0) {
														h.status &= 9;
														g = 0
													}
												} else {
													h.releaseCtr--
												}
											}
											b.volume = h.volume = g;
											b.enabled = 1;
											if (!f.synth) {
												if (f.loop) {
													b.pointer = f.loopPtr;
													b.length = f.repeat
												} else {
													b.pointer = this.mixer.loopPtr;
													b.length = 2
												}
											}
											h = h.next
										}
									}
								}
							});
			e.voices[0] = a(0);
			e.voices[0].next = e.voices[1] = a(1);
			e.voices[1].next = e.voices[2] = a(2);
			e.voices[2].next = e.voices[3] = a(3);
			return Object.seal(e)
		}
		var d = [ 0, 6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304,
				4064, 3840, 3616, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
				2280, 2152, 2032, 1920, 1808, 1712, 1616, 1524, 1440, 1356,
				1280, 1208, 1140, 1076, 960, 904, 856, 808, 762, 720, 678, 640,
				604, 570, 538, 508, 480, 452, 428, 404, 381, 360, 339, 320,
				302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160,
				151, 143, 135, 127, 120, 113, 113, 113, 113, 113, 113, 113,
				113, 113, 113, 113, 113, 113 ];
		window.neoart.D1Player = c
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				trackPtr : {
					value : 0,
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				trackLen : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				restart : {
					value : 0,
					writable : true
				},
				step : {
					value : null,
					writable : true
				},
				row : {
					value : null,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				finalPeriod : {
					value : 0,
					writable : true
				},
				arpeggioPtr : {
					value : 0,
					writable : true
				},
				arpeggioPos : {
					value : 0,
					writable : true
				},
				pitchBend : {
					value : 0,
					writable : true
				},
				portamento : {
					value : 0,
					writable : true
				},
				tableCtr : {
					value : 0,
					writable : true
				},
				tablePos : {
					value : 0,
					writable : true
				},
				vibratoCtr : {
					value : 0,
					writable : true
				},
				vibratoDir : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				vibratoPeriod : {
					value : 0,
					writable : true
				},
				vibratoSustain : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				volumeMax : {
					value : 0,
					writable : true
				},
				volumePos : {
					value : 0,
					writable : true
				},
				volumeSustain : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.sample = null;
						this.trackPtr = 0;
						this.trackPos = 0;
						this.trackLen = 0;
						this.patternPos = 0;
						this.restart = 0;
						this.step = null;
						this.row = null;
						this.note = 0;
						this.period = 0;
						this.finalPeriod = 0;
						this.arpeggioPtr = 0;
						this.arpeggioPos = 0;
						this.pitchBend = 0;
						this.portamento = 0;
						this.tableCtr = 0;
						this.tablePos = 0;
						this.vibratoCtr = 0;
						this.vibratoDir = 0;
						this.vibratoPos = 0;
						this.vibratoPeriod = 0;
						this.vibratoSustain = 0;
						this.volume = 0;
						this.volumeMax = 63;
						this.volumePos = 0;
						this.volumeSustain = 0
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				index : {
					value : 0,
					writable : true
				},
				pitchBend : {
					value : 0,
					writable : true
				},
				synth : {
					value : 0,
					writable : true
				},
				table : {
					value : null,
					writable : true
				},
				vibratos : {
					value : null,
					writable : true
				},
				volumes : {
					value : null,
					writable : true
				}
			});
			a.table = new Uint8Array(48);
			a.vibratos = new Uint8Array(15);
			a.volumes = new Uint8Array(15);
			return Object.seal(a)
		}
		function c(c) {
			var e = l(c);
			Object
					.defineProperties(
							e,
							{
								id : {
									value : "D2Player"
								},
								tracks : {
									value : [],
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								data : {
									value : null,
									writable : true
								},
								arpeggios : {
									value : null,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								noise : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.speed = 5;
										this.tick = 1;
										this.noise = 0;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.sample = this.samples[this.samples.length - 1];
											a.trackPtr = this.data[a.index];
											a.restart = this.data[a.index + 4];
											a.trackLen = this.data[a.index + 8];
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var c = 0, d, e, f = 0, g, i, k, l, m, n;
										a.position = 3014;
										d = a.readString(4);
										if (d != ".FNL")
											return;
										a.position = 4042;
										this.data = new Uint16Array(12);
										for (; c < 4; ++c) {
											this.data[c + 4] = a.readUshort() >> 1;
											n = a.readUshort() >> 1;
											this.data[c + 8] = n;
											f += n
										}
										n = f;
										for (c = 3; c > 0; --c)
											this.data[c] = n -= this.data[c + 8];
										this.tracks.length = f;
										for (c = 0; c < f; ++c) {
											m = j();
											m.pattern = a.readUbyte() << 4;
											m.transpose = a.readByte();
											this.tracks[c] = m
										}
										f = a.readUint() >> 2;
										this.patterns.length = f;
										for (c = 0; c < f; ++c) {
											k = h();
											k.note = a.readUbyte();
											k.sample = a.readUbyte();
											k.effect = a.readUbyte() - 1;
											k.param = a.readUbyte();
											this.patterns[c] = k
										}
										a.position += 254;
										n = a.readUshort();
										i = a.position;
										a.position -= 256;
										f = 1;
										g = new Uint16Array(128);
										for (c = 0; c < 128; ++c) {
											e = a.readUshort();
											if (e != n)
												g[f++] = e
										}
										this.samples.length = f;
										for (c = 0; c < f; ++c) {
											a.position = i + g[c];
											l = b();
											l.length = a.readUshort() << 1;
											l.loop = a.readUshort();
											l.repeat = a.readUshort() << 1;
											for (e = 0; e < 15; ++e)
												l.volumes[e] = a.readUbyte();
											for (e = 0; e < 15; ++e)
												l.vibratos[e] = a.readUbyte();
											l.pitchBend = a.readUshort();
											l.synth = a.readByte();
											l.index = a.readUbyte();
											for (e = 0; e < 48; ++e)
												l.table[e] = a.readUbyte();
											this.samples[c] = l
										}
										f = a.readUint();
										this.mixer.store(a, f);
										a.position += 64;
										for (c = 0; c < 8; ++c)
											g[c] = a.readUint();
										f = this.samples.length;
										i = a.position;
										for (c = 0; c < f; ++c) {
											l = this.samples[c];
											if (l.synth >= 0)
												continue;
											a.position = i + g[l.index];
											l.pointer = this.mixer.store(a,
													l.length);
											l.loopPtr = l.pointer + l.loop
										}
										a.position = 3018;
										for (c = 0; c < 1024; ++c)
											this.arpeggios[c] = a.readByte();
										l = b();
										l.pointer = l.loopPtr = this.mixer.memory.length;
										l.length = l.repeat = 2;
										this.samples[f] = l;
										f = this.patterns.length;
										e = this.samples.length - 1;
										for (c = 0; c < f; ++c) {
											k = this.patterns[c];
											if (k.sample > e)
												k.sample = 0
										}
										this.version = 2
									}
								},
								process : {
									value : function() {
										var a, b = 0, c, e, f, g, h = this.voices[0];
										for (; b < 64;) {
											this.noise = this.noise << 7
													| this.noise >>> 25;
											this.noise += 1858762093;
											this.noise ^= 2656676139;
											g = this.noise >>> 24 & 255;
											if (g > 127)
												g |= -256;
											this.mixer.memory[b++] = g;
											g = this.noise >>> 16 & 255;
											if (g > 127)
												g |= -256;
											this.mixer.memory[b++] = g;
											g = this.noise >>> 8 & 255;
											if (g > 127)
												g |= -256;
											this.mixer.memory[b++] = g;
											g = this.noise & 255;
											if (g > 127)
												g |= -256;
											this.mixer.memory[b++] = g
										}
										if (--this.tick < 0)
											this.tick = this.speed;
										while (h) {
											if (h.trackLen < 1) {
												h = h.next;
												continue
											}
											a = h.channel;
											f = h.sample;
											if (f.synth) {
												a.pointer = f.loopPtr;
												a.length = f.repeat
											}
											if (this.tick == 0) {
												if (h.patternPos == 0) {
													h.step = this.tracks[h.trackPtr
															+ h.trackPos];
													if (++h.trackPos == h.trackLen)
														h.trackPos = h.restart
												}
												e = h.row = this.patterns[h.step.pattern
														+ h.patternPos];
												if (e.note) {
													a.enabled = 0;
													h.note = e.note;
													h.period = d[e.note
															+ h.step.transpose];
													f = h.sample = this.samples[e.sample];
													if (f.synth < 0) {
														a.pointer = f.pointer;
														a.length = f.length
													}
													h.arpeggioPos = 0;
													h.tableCtr = 0;
													h.tablePos = 0;
													h.vibratoCtr = f.vibratos[1];
													h.vibratoPos = 0;
													h.vibratoDir = 0;
													h.vibratoPeriod = 0;
													h.vibratoSustain = f.vibratos[2];
													h.volume = 0;
													h.volumePos = 0;
													h.volumeSustain = 0
												}
												switch (e.effect) {
												case -1:
													break;
												case 0:
													this.speed = e.param & 15;
													break;
												case 1:
													this.mixer.filter.active = e.param;
													break;
												case 2:
													h.pitchBend = ~(e.param & 255) + 1;
													break;
												case 3:
													h.pitchBend = e.param & 255;
													break;
												case 4:
													h.portamento = e.param;
													break;
												case 5:
													h.volumeMax = e.param & 63;
													break;
												case 6:
													this.mixer.volume = e.param;
													break;
												case 7:
													h.arpeggioPtr = (e.param & 63) << 4;
													break
												}
												h.patternPos = ++h.patternPos & 15
											}
											f = h.sample;
											if (f.synth >= 0) {
												if (h.tableCtr) {
													h.tableCtr--
												} else {
													h.tableCtr = f.index;
													g = f.table[h.tablePos];
													if (g == 255) {
														g = f.table[++h.tablePos];
														if (g != 255) {
															h.tablePos = g;
															g = f.table[h.tablePos]
														}
													}
													if (g != 255) {
														a.pointer = g << 8;
														a.length = f.length;
														if (++h.tablePos > 47)
															h.tablePos = 0
													}
												}
											}
											g = f.vibratos[h.vibratoPos];
											if (h.vibratoDir)
												h.vibratoPeriod -= g;
											else
												h.vibratoPeriod += g;
											if (--h.vibratoCtr == 0) {
												h.vibratoCtr = f.vibratos[h.vibratoPos + 1];
												h.vibratoDir = ~h.vibratoDir
											}
											if (h.vibratoSustain) {
												h.vibratoSustain--
											} else {
												h.vibratoPos += 3;
												if (h.vibratoPos == 15)
													h.vibratoPos = 12;
												h.vibratoSustain = f.vibratos[h.vibratoPos + 2]
											}
											if (h.volumeSustain) {
												h.volumeSustain--
											} else {
												g = f.volumes[h.volumePos];
												c = f.volumes[h.volumePos + 1];
												if (c < h.volume) {
													h.volume -= g;
													if (h.volume < c) {
														h.volume = c;
														h.volumePos += 3;
														h.volumeSustain = f.volumes[h.volumePos - 1]
													}
												} else {
													h.volume += g;
													if (h.volume > c) {
														h.volume = c;
														h.volumePos += 3;
														if (h.volumePos == 15)
															h.volumePos = 12;
														h.volumeSustain = f.volumes[h.volumePos - 1]
													}
												}
											}
											if (h.portamento) {
												if (h.period < h.finalPeriod) {
													h.finalPeriod -= h.portamento;
													if (h.finalPeriod < h.period)
														h.finalPeriod = h.period
												} else {
													h.finalPeriod += h.portamento;
													if (h.finalPeriod > h.period)
														h.finalPeriod = h.period
												}
											}
											g = this.arpeggios[h.arpeggioPtr
													+ h.arpeggioPos];
											if (g == -128) {
												h.arpeggioPos = 0;
												g = this.arpeggios[h.arpeggioPtr]
											}
											h.arpeggioPos = ++h.arpeggioPos & 15;
											if (h.portamento == 0) {
												g = h.note + h.step.transpose
														+ g;
												if (g < 0)
													g = 0;
												h.finalPeriod = d[g]
											}
											h.vibratoPeriod -= f.pitchBend
													- h.pitchBend;
											a.period = h.finalPeriod
													+ h.vibratoPeriod;
											g = h.volume >> 2 & 63;
											if (g > h.volumeMax)
												g = h.volumeMax;
											a.volume = g;
											a.enabled = 1;
											h = h.next
										}
									}
								}
							});
			e.voices[0] = a(0);
			e.voices[0].next = e.voices[1] = a(1);
			e.voices[1].next = e.voices[2] = a(2);
			e.voices[2].next = e.voices[3] = a(3);
			e.arpeggios = new Int8Array(1024);
			return Object.seal(e)
		}
		var d = [ 0, 6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304,
				4064, 3840, 3616, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
				2280, 2152, 2032, 1920, 1808, 1712, 1616, 1524, 1440, 1356,
				1280, 1208, 1140, 1076, 1016, 960, 904, 856, 808, 762, 720,
				678, 640, 604, 570, 538, 508, 480, 452, 428, 404, 381, 360,
				339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
				170, 160, 151, 143, 135, 127, 120, 113, 113, 113, 113, 113,
				113, 113, 113, 113, 113, 113, 113, 113 ];
		window.neoart.D2Player = c
	})();
	(function() {
		function a() {
			return Object.create(null, {
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				step : {
					value : null,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				val1 : {
					value : 0,
					writable : true
				},
				val2 : {
					value : 0,
					writable : true
				},
				finalPeriod : {
					value : 0,
					writable : true
				},
				arpeggioStep : {
					value : 0,
					writable : true
				},
				effectCtr : {
					value : 0,
					writable : true
				},
				pitch : {
					value : 0,
					writable : true
				},
				pitchCtr : {
					value : 0,
					writable : true
				},
				pitchStep : {
					value : 0,
					writable : true
				},
				portamento : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				volumeCtr : {
					value : 0,
					writable : true
				},
				volumeStep : {
					value : 0,
					writable : true
				},
				mixMute : {
					value : 0,
					writable : true
				},
				mixPtr : {
					value : 0,
					writable : true
				},
				mixEnd : {
					value : 0,
					writable : true
				},
				mixSpeed : {
					value : 0,
					writable : true
				},
				mixStep : {
					value : 0,
					writable : true
				},
				mixVolume : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.sample = null;
						this.step = null;
						this.note = 0;
						this.period = 0;
						this.val1 = 0;
						this.val2 = 0;
						this.finalPeriod = 0;
						this.arpeggioStep = 0;
						this.effectCtr = 0;
						this.pitch = 0;
						this.pitchCtr = 0;
						this.pitchStep = 0;
						this.portamento = 0;
						this.volume = 0;
						this.volumeCtr = 0;
						this.volumeStep = 0;
						this.mixMute = 1;
						this.mixPtr = 0;
						this.mixEnd = 0;
						this.mixSpeed = 0;
						this.mixStep = 0;
						this.mixVolume = 0
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				wave : {
					value : 0,
					writable : true
				},
				waveLen : {
					value : 0,
					writable : true
				},
				finetune : {
					value : 0,
					writable : true
				},
				arpeggio : {
					value : 0,
					writable : true
				},
				pitch : {
					value : 0,
					writable : true
				},
				pitchDelay : {
					value : 0,
					writable : true
				},
				pitchLoop : {
					value : 0,
					writable : true
				},
				pitchSpeed : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				effectDone : {
					value : 0,
					writable : true
				},
				effectStep : {
					value : 0,
					writable : true
				},
				effectSpeed : {
					value : 0,
					writable : true
				},
				source1 : {
					value : 0,
					writable : true
				},
				source2 : {
					value : 0,
					writable : true
				},
				volumeLoop : {
					value : 0,
					writable : true
				},
				volumeSpeed : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c() {
			return Object.create(null, {
				title : {
					value : "",
					writable : true
				},
				speed : {
					value : 0,
					writable : true
				},
				length : {
					value : 0,
					writable : true
				},
				loop : {
					value : 0,
					writable : true
				},
				loopStep : {
					value : 0,
					writable : true
				},
				tracks : {
					value : [],
					writable : true
				}
			})
		}
		function d(d) {
			var i = l(d);
			Object
					.defineProperties(
							i,
							{
								id : {
									value : "DMPlayer"
								},
								songs : {
									value : [],
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								buffer1 : {
									value : 0,
									writable : true
								},
								buffer2 : {
									value : 0,
									writable : true
								},
								song1 : {
									value : 0,
									writable : true
								},
								song2 : {
									value : 0,
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								patternLen : {
									value : 0,
									writable : true
								},
								patternEnd : {
									value : 0,
									writable : true
								},
								stepEnd : {
									value : 0,
									writable : true
								},
								numChannels : {
									value : 0,
									writable : true
								},
								arpeggios : {
									value : null,
									writable : true
								},
								averages : {
									value : null,
									writable : true
								},
								volumes : {
									value : null,
									writable : true
								},
								mixChannel : {
									value : null,
									writable : true
								},
								mixPeriod : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a, b = 0, c, d;
										this.reset();
										if (this.playSong > 7)
											this.playSong = 0;
										this.song1 = this.songs[this.playSong];
										this.speed = this.song1.speed & 15;
										this.speed |= this.speed << 4;
										this.tick = this.song1.speed;
										this.trackPos = 0;
										this.patternPos = 0;
										this.patternLen = 64;
										this.patternEnd = 1;
										this.stepEnd = 1;
										this.numChannels = 4;
										for (; b < 7; ++b) {
											d = this.voices[b];
											d.initialize();
											d.sample = this.samples[0];
											if (b < 4) {
												a = this.mixer.channels[b];
												a.enabled = 0;
												a.pointer = this.mixer.loopPtr;
												a.length = 2;
												a.period = 124;
												a.volume = 0;
												d.channel = a
											}
										}
										if (this.version == g) {
											if ((this.playSong & 1) != 0)
												this.playSong--;
											this.song2 = this.songs[this.playSong + 1];
											this.mixChannel = f(7);
											this.numChannels = 7;
											a = this.mixer.channels[3];
											a.mute = 0;
											a.pointer = this.buffer1;
											a.length = 350;
											a.period = this.mixPeriod;
											a.volume = 64;
											c = this.buffer1 + 700;
											for (b = this.buffer1; b < c; ++b)
												this.mixer.memory[b] = 0
										}
									}
								},
								loader : {
									value : function(a) {
										var d, f = 0, i, k, l, m, n, o, p, q, r, s;
										i = a.readString(24);
										if (i == " MUGICIAN/SOFTEYES 1990 ")
											this.version = e;
										else if (i == " MUGICIAN2/SOFTEYES 1990")
											this.version = g;
										else
											return;
										a.position = 28;
										k = new Uint32Array(8);
										for (; f < 8; ++f)
											k[f] = a.readUint();
										a.position = 76;
										for (f = 0; f < 8; ++f) {
											r = c();
											r.loop = a.readUbyte();
											r.loopStep = a.readUbyte() << 2;
											r.speed = a.readUbyte();
											r.length = a.readUbyte() << 2;
											r.title = a.readString(12);
											this.songs[f] = r
										}
										a.position = 204;
										this.lastSong = this.songs.length - 1;
										for (f = 0; f < 8; ++f) {
											r = this.songs[f];
											n = k[f] << 2;
											for (m = 0; m < n; ++m) {
												s = j();
												s.pattern = a.readUbyte() << 6;
												s.transpose = a.readByte();
												r.tracks[m] = s
											}
										}
										o = a.position;
										a.position = 60;
										n = a.readUint();
										this.samples.length = ++n;
										a.position = o;
										for (f = 1; f < n; ++f) {
											q = b();
											q.wave = a.readUbyte();
											q.waveLen = a.readUbyte() << 1;
											q.volume = a.readUbyte();
											q.volumeSpeed = a.readUbyte();
											q.arpeggio = a.readUbyte();
											q.pitch = a.readUbyte();
											q.effectStep = a.readUbyte();
											q.pitchDelay = a.readUbyte();
											q.finetune = a.readUbyte() << 6;
											q.pitchLoop = a.readUbyte();
											q.pitchSpeed = a.readUbyte();
											q.effect = a.readUbyte();
											q.source1 = a.readUbyte();
											q.source2 = a.readUbyte();
											q.effectSpeed = a.readUbyte();
											q.volumeLoop = a.readUbyte();
											this.samples[f] = q
										}
										this.samples[0] = this.samples[1];
										o = a.position;
										a.position = 64;
										n = a.readUint() << 7;
										a.position = o;
										this.mixer.store(a, n);
										o = a.position;
										a.position = 68;
										l = a.readUint();
										a.position = 26;
										n = a.readUshort() << 6;
										this.patterns.length = n;
										a.position = o + (l << 5);
										if (l)
											l = o;
										for (f = 0; f < n; ++f) {
											p = h();
											p.note = a.readUbyte();
											p.sample = a.readUbyte() & 63;
											p.effect = a.readUbyte();
											p.param = a.readByte();
											this.patterns[f] = p
										}
										o = a.position;
										a.position = 72;
										if (l) {
											n = a.readUint();
											a.position = o;
											d = this.mixer.store(a, n);
											o = a.position;
											this.mixer.memory.length += 350;
											this.buffer1 = this.mixer.memory.length;
											this.mixer.memory.length += 350;
											this.buffer2 = this.mixer.memory.length;
											this.mixer.memory.length += 350;
											this.mixer.loopLen = 8;
											n = this.samples.length;
											for (f = 1; f < n; ++f) {
												q = this.samples[f];
												if (q.wave < 32)
													continue;
												a.position = l
														+ (q.wave - 32 << 5);
												q.pointer = a.readUint();
												q.length = a.readUint()
														- q.pointer;
												q.loop = a.readUint();
												q.name = a.readString(12);
												if (q.loop) {
													q.loop -= q.pointer;
													q.repeat = q.length
															- q.loop;
													if ((q.repeat & 1) != 0)
														q.repeat--
												} else {
													q.loopPtr = this.mixer.memory.length;
													q.repeat = 8
												}
												if ((q.pointer & 1) != 0)
													q.pointer--;
												if ((q.length & 1) != 0)
													q.length--;
												q.pointer += d;
												if (!q.loopPtr)
													q.loopPtr = q.pointer
															+ q.loop
											}
										} else {
											o += a.readUint()
										}
										a.position = 24;
										if (a.readUshort() == 1) {
											a.position = o;
											n = a.length - a.position;
											if (n > 256)
												n = 256;
											for (f = 0; f < n; ++f)
												this.arpeggios[f] = a
														.readUbyte()
										}
									}
								},
								process : {
									value : function() {
										var a, b, c = 0, d, e, f, g = this.mixer.memory, h, i, j, l, m, n, o;
										for (; c < this.numChannels; ++c) {
											o = this.voices[c];
											m = o.sample;
											if (c < 3 || this.numChannels == 4) {
												a = o.channel;
												if (this.stepEnd)
													o.step = this.song1.tracks[this.trackPos
															+ c];
												if (m.wave > 31) {
													a.pointer = m.loopPtr;
													a.length = m.repeat
												}
											} else {
												a = this.mixChannel;
												if (this.stepEnd)
													o.step = this.song2.tracks[this.trackPos
															+ (c - 3)]
											}
											if (this.patternEnd) {
												i = this.patterns[o.step.pattern
														+ this.patternPos];
												if (i.note) {
													if (i.effect != 74) {
														o.note = i.note;
														if (i.sample)
															m = o.sample = this.samples[i.sample]
													}
													o.val1 = i.effect < 64 ? 1
															: i.effect - 62;
													o.val2 = i.param;
													d = o.step.transpose
															+ m.finetune;
													if (o.val1 != 12) {
														o.pitch = i.effect;
														if (o.val1 == 1) {
															d += o.pitch;
															if (d < 0)
																o.period = 0;
															else
																o.period = k[d]
														}
													} else {
														o.pitch = i.note;
														d += o.pitch;
														if (d < 0)
															o.period = 0;
														else
															o.period = k[d]
													}
													if (o.val1 == 11)
														m.arpeggio = o.val2 & 7;
													if (o.val1 != 12) {
														if (m.wave > 31) {
															a.pointer = m.pointer;
															a.length = m.length;
															a.enabled = 0;
															o.mixPtr = m.pointer;
															o.mixEnd = m.pointer
																	+ m.length;
															o.mixMute = 0
														} else {
															b = m.wave << 7;
															a.pointer = b;
															a.length = m.waveLen;
															if (o.val1 != 10)
																a.enabled = 0;
															if (this.numChannels == 4) {
																if (m.effect != 0
																		&& o.val1 != 2
																		&& o.val1 != 4) {
																	f = b + 128;
																	j = m.source1 << 7;
																	for (e = b; e < f; ++e)
																		g[e] = g[j++];
																	m.effectStep = 0;
																	o.effectCtr = m.effectSpeed
																}
															}
														}
													}
													if (o.val1 != 3
															&& o.val1 != 4
															&& o.val1 != 12) {
														o.volumeCtr = 1;
														o.volumeStep = 0
													}
													o.arpeggioStep = 0;
													o.pitchCtr = m.pitchDelay;
													o.pitchStep = 0;
													o.portamento = 0
												}
											}
											switch (o.val1) {
											case 0:
												break;
											case 5:
												n = o.val2;
												if (n > 0 && n < 65)
													this.patternLen = n;
												break;
											case 6:
												n = o.val2 & 15;
												n |= n << 4;
												if (o.val2 == 0 || o.val2 > 15)
													break;
												this.speed = n;
												break;
											case 7:
												this.mixer.filter.active = 1;
												break;
											case 8:
												this.mixer.filter.active = 0;
												break;
											case 13:
												o.val1 = 0;
												n = o.val2 & 15;
												if (n == 0)
													break;
												n = o.val2 & 240;
												if (n == 0)
													break;
												this.speed = o.val2;
												break
											}
										}
										for (c = 0; c < this.numChannels; ++c) {
											o = this.voices[c];
											m = o.sample;
											if (this.numChannels == 4) {
												a = o.channel;
												if (m.wave < 32 && m.effect
														&& !m.effectDone) {
													m.effectDone = 1;
													if (o.effectCtr) {
														o.effectCtr--
													} else {
														o.effectCtr = m.effectSpeed;
														b = m.wave << 7;
														switch (m.effect) {
														case 1:
															for (e = 0; e < 127; ++e) {
																n = g[b];
																n += g[b + 1];
																g[b++] = n >> 1
															}
															break;
														case 2:
															j = m.source1 << 7;
															l = m.source2 << 7;
															d = m.effectStep;
															f = m.waveLen;
															m.effectStep = ++m.effectStep & 127;
															for (e = 0; e < f; ++e) {
																n = g[j++];
																n += g[l + d];
																g[b++] = n >> 1;
																d = ++d & 127
															}
															break;
														case 3:
															n = g[b];
															for (e = 0; e < 127; ++e)
																g[b] = g[++b];
															g[b] = n;
															break;
														case 4:
															b += 127;
															n = g[b];
															for (e = 0; e < 127; ++e)
																g[b] = g[--b];
															g[b] = n;
															break;
														case 5:
															d = n = b;
															for (e = 0; e < 64; ++e) {
																g[d++] = g[b++];
																b++
															}
															d = b = n;
															d += 64;
															for (e = 0; e < 64; ++e)
																g[d++] = g[b++];
															break;
														case 6:
															j = b + 64;
															b += 128;
															for (e = 0; e < 64; ++e) {
																g[--b] = g[--j];
																g[--b] = g[j]
															}
															break;
														case 7:
															b += m.effectStep;
															g[b] = ~g[b] + 1;
															if (++m.effectStep >= m.waveLen)
																m.effectStep = 0;
															break;
														case 8:
															m.effectStep = ++m.effectStep & 127;
															l = (m.source2 << 7)
																	+ m.effectStep;
															d = g[l];
															f = m.waveLen;
															n = 3;
															for (e = 0; e < f; ++e) {
																j = g[b] + n;
																if (j < -128)
																	j += 256;
																else if (j > 127)
																	j -= 256;
																g[b++] = j;
																n += d;
																if (n < -128)
																	n += 256;
																else if (n > 127)
																	n -= 256
															}
															break;
														case 9:
															l = m.source2 << 7;
															f = m.waveLen;
															for (e = 0; e < f; ++e) {
																n = g[l++];
																n += g[b];
																if (n > 127)
																	n -= 256;
																g[b++] = n
															}
															break;
														case 10:
															for (e = 0; e < 126; ++e) {
																n = g[b++] * 3;
																n += g[b + 1];
																g[b] = n >> 2
															}
															break;
														case 11:
															j = m.source1 << 7;
															l = m.source2 << 7;
															f = m.waveLen;
															m.effectStep = ++m.effectStep & 127;
															n = m.effectStep;
															if (n >= 64)
																n = 127 - n;
															d = (n ^ 255) & 63;
															for (e = 0; e < f; ++e) {
																h = g[j++] * n;
																h += g[l++] * d;
																g[b++] = h >> 6
															}
															break;
														case 12:
															j = m.source1 << 7;
															l = m.source2 << 7;
															f = m.waveLen;
															m.effectStep = ++m.effectStep & 31;
															n = m.effectStep;
															if (n >= 16)
																n = 31 - n;
															d = (n ^ 255) & 15;
															for (e = 0; e < f; ++e) {
																h = g[j++] * n;
																h += g[l++] * d;
																g[b++] = h >> 4
															}
															break;
														case 13:
															for (e = 0; e < 126; ++e) {
																n = g[b++];
																n += g[b + 1];
																g[b] = n >> 1
															}
															break;
														case 14:
															d = b
																	+ m.effectStep;
															g[d] = ~g[d] + 1;
															d = m.effectStep
																	+ m.source2
																	& m.waveLen
																	- 1;
															d += b;
															g[d] = ~g[d] + 1;
															if (++m.effectStep >= m.waveLen)
																m.effectStep = 0;
															break;
														case 15:
															d = b;
															for (e = 0; e < 127; ++e) {
																n = g[b];
																n += g[b + 1];
																g[b++] = n >> 1
															}
															b = d;
															m.effectStep++;
															if (m.effectStep == m.source2) {
																m.effectStep = 0;
																d = n = b;
																for (e = 0; e < 64; ++e) {
																	g[d++] = g[b++];
																	b++
																}
																d = b = n;
																d += 64;
																for (e = 0; e < 64; ++e)
																	g[d++] = g[b++]
															}
															break
														}
													}
												}
											} else {
												a = c < 3 ? o.channel
														: this.mixChannel
											}
											if (o.volumeCtr) {
												o.volumeCtr--;
												if (o.volumeCtr == 0) {
													o.volumeCtr = m.volumeSpeed;
													o.volumeStep = ++o.volumeStep & 127;
													if (o.volumeStep
															|| m.volumeLoop) {
														d = o.volumeStep
																+ (m.volume << 7);
														n = ~(g[d] + 129) + 1;
														o.volume = (n & 255) >> 2;
														a.volume = o.volume
													} else {
														o.volumeCtr = 0
													}
												}
											}
											n = o.note;
											if (m.arpeggio) {
												d = o.arpeggioStep
														+ (m.arpeggio << 5);
												n += this.arpeggios[d];
												o.arpeggioStep = ++o.arpeggioStep & 31
											}
											d = n + o.step.transpose
													+ m.finetune;
											o.finalPeriod = k[d];
											b = o.finalPeriod;
											if (o.val1 == 1 || o.val1 == 12) {
												n = ~o.val2 + 1;
												o.portamento += n;
												o.finalPeriod += o.portamento;
												if (o.val2) {
													if (n < 0
															&& o.finalPeriod <= o.period
															|| n >= 0
															&& o.finalPeriod >= o.period) {
														o.portamento = o.period
																- b;
														o.val2 = 0
													}
												}
											}
											if (m.pitch) {
												if (o.pitchCtr) {
													o.pitchCtr--
												} else {
													d = o.pitchStep;
													o.pitchStep = ++o.pitchStep & 127;
													if (o.pitchStep == 0)
														o.pitchStep = m.pitchLoop;
													d += m.pitch << 7;
													n = g[d];
													o.finalPeriod += ~n + 1
												}
											}
											a.period = o.finalPeriod
										}
										if (this.numChannels > 4) {
											j = this.buffer1;
											this.buffer1 = this.buffer2;
											this.buffer2 = j;
											a = this.mixer.channels[3];
											a.pointer = j;
											for (c = 3; c < 7; ++c) {
												o = this.voices[c];
												o.mixStep = 0;
												if (o.finalPeriod < 125) {
													o.mixMute = 1;
													o.mixSpeed = 0
												} else {
													e = (o.finalPeriod << 8)
															/ this.mixPeriod
															& 65535;
													l = (256 / e & 255) << 8;
													b = 256 % e << 8 & 16777215;
													o.mixSpeed = (l | b / e
															& 255) << 8
												}
												if (o.mixMute)
													o.mixVolume = 0;
												else
													o.mixVolume = o.volume << 8
											}
											for (c = 0; c < 350; ++c) {
												b = 0;
												for (e = 3; e < 7; ++e) {
													o = this.voices[e];
													l = (g[o.mixPtr
															+ (o.mixStep >> 16)] & 255)
															+ o.mixVolume;
													b += this.volumes[l];
													o.mixStep += o.mixSpeed
												}
												g[j++] = this.averages[b]
											}
											a.length = 350;
											a.period = this.mixPeriod;
											a.volume = 64
										}
										if (--this.tick == 0) {
											this.tick = this.speed & 15;
											this.speed = (this.speed & 240) >> 4;
											this.speed |= this.tick << 4;
											this.patternEnd = 1;
											this.patternPos++;
											if (this.patternPos == 64
													|| this.patternPos == this.patternLen) {
												this.patternPos = 0;
												this.stepEnd = 1;
												this.trackPos += 4;
												if (this.trackPos == this.song1.length) {
													this.trackPos = this.song1.loopStep;
													this.mixer.complete = 1
												}
											}
										} else {
											this.patternEnd = 0;
											this.stepEnd = 0
										}
										for (c = 0; c < this.numChannels; ++c) {
											o = this.voices[c];
											o.mixPtr += o.mixStep >> 16;
											m = o.sample;
											m.effectDone = 0;
											if (o.mixPtr >= o.mixEnd) {
												if (m.loop) {
													o.mixPtr -= m.repeat
												} else {
													o.mixPtr = 0;
													o.mixMute = 1
												}
											}
											if (c < 4) {
												a = o.channel;
												a.enabled = 1
											}
										}
									}
								},
								tables : {
									value : function() {
										var a = 0, b, c, d = 0, e = 0, f, g, h = 128;
										this.averages = new Int32Array(1024);
										this.volumes = new Int32Array(16384);
										this.mixPeriod = 203;
										for (; a < 1024; ++a) {
											if (h > 127)
												h -= 256;
											this.averages[a] = h;
											if (a > 383 && a < 639)
												h = ++h & 255
										}
										for (a = 0; a < 64; ++a) {
											f = -128;
											g = 128;
											for (c = 0; c < 256; ++c) {
												h = f * e / 63 + 128;
												b = d + g;
												this.volumes[b] = h & 255;
												if (a != 0 && a != 63
														&& g >= 128)
													--this.volumes[b];
												f++;
												g = ++g & 255
											}
											d += 256;
											e++
										}
									}
								}
							});
			i.voices[0] = a();
			i.voices[1] = a();
			i.voices[2] = a();
			i.voices[3] = a();
			i.voices[4] = a();
			i.voices[5] = a();
			i.voices[6] = a();
			i.arpeggios = new Uint8Array(256);
			i.tables();
			return Object.seal(i)
		}
		var e = 1, g = 2, k = [ 3220, 3040, 2869, 2708, 2556, 2412, 2277, 2149,
				2029, 1915, 1807, 1706, 1610, 1520, 1434, 1354, 1278, 1206,
				1139, 1075, 1014, 957, 904, 853, 805, 760, 717, 677, 639, 603,
				569, 537, 507, 479, 452, 426, 403, 380, 359, 338, 319, 302,
				285, 269, 254, 239, 226, 213, 201, 190, 179, 169, 160, 151,
				142, 134, 127, 4842, 4571, 4314, 4072, 3843, 3628, 3424, 3232,
				3051, 2879, 2718, 2565, 2421, 2285, 2157, 2036, 1922, 1814,
				1712, 1616, 1525, 1440, 1359, 1283, 1211, 1143, 1079, 1018,
				961, 907, 856, 808, 763, 720, 679, 641, 605, 571, 539, 509,
				480, 453, 428, 404, 381, 360, 340, 321, 303, 286, 270, 254,
				240, 227, 214, 202, 191, 180, 170, 160, 151, 143, 135, 127,
				4860, 4587, 4330, 4087, 3857, 3641, 3437, 3244, 3062, 2890,
				2728, 2574, 2430, 2294, 2165, 2043, 1929, 1820, 1718, 1622,
				1531, 1445, 1364, 1287, 1215, 1147, 1082, 1022, 964, 910, 859,
				811, 765, 722, 682, 644, 607, 573, 541, 511, 482, 455, 430,
				405, 383, 361, 341, 322, 304, 287, 271, 255, 241, 228, 215,
				203, 191, 181, 170, 161, 152, 143, 135, 128, 4878, 4604, 4345,
				4102, 3871, 3654, 3449, 3255, 3073, 2900, 2737, 2584, 2439,
				2302, 2173, 2051, 1936, 1827, 1724, 1628, 1536, 1450, 1369,
				1292, 1219, 1151, 1086, 1025, 968, 914, 862, 814, 768, 725,
				684, 646, 610, 575, 543, 513, 484, 457, 431, 407, 384, 363,
				342, 323, 305, 288, 272, 256, 242, 228, 216, 203, 192, 181,
				171, 161, 152, 144, 136, 128, 4895, 4620, 4361, 4116, 3885,
				3667, 3461, 3267, 3084, 2911, 2747, 2593, 2448, 2310, 2181,
				2058, 1943, 1834, 1731, 1634, 1542, 1455, 1374, 1297, 1224,
				1155, 1090, 1029, 971, 917, 865, 817, 771, 728, 687, 648, 612,
				578, 545, 515, 486, 458, 433, 408, 385, 364, 343, 324, 306,
				289, 273, 257, 243, 229, 216, 204, 193, 182, 172, 162, 153,
				144, 136, 129, 4913, 4637, 4377, 4131, 3899, 3681, 3474, 3279,
				3095, 2921, 2757, 2603, 2456, 2319, 2188, 2066, 1950, 1840,
				1737, 1639, 1547, 1461, 1379, 1301, 1228, 1159, 1094, 1033,
				975, 920, 868, 820, 774, 730, 689, 651, 614, 580, 547, 516,
				487, 460, 434, 410, 387, 365, 345, 325, 307, 290, 274, 258,
				244, 230, 217, 205, 193, 183, 172, 163, 154, 145, 137, 129,
				4931, 4654, 4393, 4146, 3913, 3694, 3486, 3291, 3106, 2932,
				2767, 2612, 2465, 2327, 2196, 2073, 1957, 1847, 1743, 1645,
				1553, 1466, 1384, 1306, 1233, 1163, 1098, 1037, 978, 923, 872,
				823, 777, 733, 692, 653, 616, 582, 549, 518, 489, 462, 436,
				411, 388, 366, 346, 326, 308, 291, 275, 259, 245, 231, 218,
				206, 194, 183, 173, 163, 154, 145, 137, 130, 4948, 4671, 4409,
				4161, 3928, 3707, 3499, 3303, 3117, 2942, 2777, 2621, 2474,
				2335, 2204, 2081, 1964, 1854, 1750, 1651, 1559, 1471, 1389,
				1311, 1237, 1168, 1102, 1040, 982, 927, 875, 826, 779, 736,
				694, 655, 619, 584, 551, 520, 491, 463, 437, 413, 390, 368,
				347, 328, 309, 292, 276, 260, 245, 232, 219, 206, 195, 184,
				174, 164, 155, 146, 138, 130, 4966, 4688, 4425, 4176, 3942,
				3721, 3512, 3315, 3129, 2953, 2787, 2631, 2483, 2344, 2212,
				2088, 1971, 1860, 1756, 1657, 1564, 1477, 1394, 1315, 1242,
				1172, 1106, 1044, 985, 930, 878, 829, 782, 738, 697, 658, 621,
				586, 553, 522, 493, 465, 439, 414, 391, 369, 348, 329, 310,
				293, 277, 261, 246, 233, 219, 207, 196, 185, 174, 164, 155,
				146, 138, 131, 4984, 4705, 4441, 4191, 3956, 3734, 3524, 3327,
				3140, 2964, 2797, 2640, 2492, 2352, 2220, 2096, 1978, 1867,
				1762, 1663, 1570, 1482, 1399, 1320, 1246, 1176, 1110, 1048,
				989, 934, 881, 832, 785, 741, 699, 660, 623, 588, 555, 524,
				495, 467, 441, 416, 392, 370, 350, 330, 312, 294, 278, 262,
				247, 233, 220, 208, 196, 185, 175, 165, 156, 147, 139, 131,
				5002, 4722, 4457, 4206, 3970, 3748, 3537, 3339, 3151, 2974,
				2807, 2650, 2501, 2361, 2228, 2103, 1985, 1874, 1769, 1669,
				1576, 1487, 1404, 1325, 1251, 1180, 1114, 1052, 993, 937, 884,
				835, 788, 744, 702, 662, 625, 590, 557, 526, 496, 468, 442,
				417, 394, 372, 351, 331, 313, 295, 279, 263, 248, 234, 221,
				209, 197, 186, 175, 166, 156, 148, 139, 131, 5020, 4739, 4473,
				4222, 3985, 3761, 3550, 3351, 3163, 2985, 2818, 2659, 2510,
				2369, 2236, 2111, 1992, 1881, 1775, 1675, 1581, 1493, 1409,
				1330, 1255, 1185, 1118, 1055, 996, 940, 887, 838, 791, 746,
				704, 665, 628, 592, 559, 528, 498, 470, 444, 419, 395, 373,
				352, 332, 314, 296, 280, 264, 249, 235, 222, 209, 198, 187,
				176, 166, 157, 148, 140, 132, 5039, 4756, 4489, 4237, 3999,
				3775, 3563, 3363, 3174, 2996, 2828, 2669, 2519, 2378, 2244,
				2118, 2e3, 1887, 1781, 1681, 1587, 1498, 1414, 1335, 1260,
				1189, 1122, 1059, 1e3, 944, 891, 841, 794, 749, 707, 667, 630,
				594, 561, 530, 500, 472, 445, 420, 397, 374, 353, 334, 315,
				297, 281, 265, 250, 236, 223, 210, 198, 187, 177, 167, 157,
				149, 140, 132, 5057, 4773, 4505, 4252, 4014, 3788, 3576, 3375,
				3186, 3007, 2838, 2679, 2528, 2387, 2253, 2126, 2007, 1894,
				1788, 1688, 1593, 1503, 1419, 1339, 1264, 1193, 1126, 1063,
				1003, 947, 894, 844, 796, 752, 710, 670, 632, 597, 563, 532,
				502, 474, 447, 422, 398, 376, 355, 335, 316, 298, 282, 266,
				251, 237, 223, 211, 199, 188, 177, 167, 158, 149, 141, 133,
				5075, 4790, 4521, 4268, 4028, 3802, 3589, 3387, 3197, 3018,
				2848, 2688, 2538, 2395, 2261, 2134, 2014, 1901, 1794, 1694,
				1599, 1509, 1424, 1344, 1269, 1198, 1130, 1067, 1007, 951, 897,
				847, 799, 754, 712, 672, 634, 599, 565, 533, 504, 475, 449,
				423, 400, 377, 356, 336, 317, 299, 283, 267, 252, 238, 224,
				212, 200, 189, 178, 168, 159, 150, 141, 133, 5093, 4808, 4538,
				4283, 4043, 3816, 3602, 3399, 3209, 3029, 2859, 2698, 2547,
				2404, 2269, 2142, 2021, 1908, 1801, 1700, 1604, 1514, 1429,
				1349, 1273, 1202, 1134, 1071, 1011, 954, 900, 850, 802, 757,
				715, 675, 637, 601, 567, 535, 505, 477, 450, 425, 401, 379,
				357, 337, 318, 300, 284, 268, 253, 238, 225, 212, 201, 189,
				179, 169, 159, 150, 142, 134 ];
		window.neoart.DMPlayer = d
	})();
	(function() {
		function a(a, b) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				bitFlag : {
					value : b,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				trackPtr : {
					value : 0,
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				frqseqPtr : {
					value : 0,
					writable : true
				},
				frqseqPos : {
					value : 0,
					writable : true
				},
				volseqPtr : {
					value : 0,
					writable : true
				},
				volseqPos : {
					value : 0,
					writable : true
				},
				volseqSpeed : {
					value : 0,
					writable : true
				},
				volseqCounter : {
					value : 0,
					writable : true
				},
				halve : {
					value : 0,
					writable : true
				},
				speed : {
					value : 0,
					writable : true
				},
				tick : {
					value : 0,
					writable : true
				},
				busy : {
					value : 0,
					writable : true
				},
				flags : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				transpose : {
					value : 0,
					writable : true
				},
				portaDelay : {
					value : 0,
					writable : true
				},
				portaDelta : {
					value : 0,
					writable : true
				},
				portaSpeed : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				vibratoDelta : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				vibratoDepth : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.trackPtr = 0;
						this.trackPos = 0;
						this.patternPos = 0;
						this.frqseqPtr = 0;
						this.frqseqPos = 0;
						this.volseqPtr = 0;
						this.volseqPos = 0;
						this.volseqSpeed = 0;
						this.volseqCounter = 0;
						this.halve = 0;
						this.speed = 0;
						this.tick = 1;
						this.busy = -1;
						this.flags = 0;
						this.note = 0;
						this.period = 0;
						this.transpose = 0;
						this.portaDelay = 0;
						this.portaDelta = 0;
						this.portaSpeed = 0;
						this.vibrato = 0;
						this.vibratoDelta = 0;
						this.vibratoSpeed = 0;
						this.vibratoDepth = 0
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				relative : {
					value : 0,
					writable : true
				},
				finetune : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c() {
			return Object.create(null, {
				speed : {
					value : 0,
					writable : true
				},
				delay : {
					value : 0,
					writable : true
				},
				tracks : {
					value : null,
					writable : true
				}
			})
		}
		function d(d) {
			var e = l(d);
			Object
					.defineProperties(
							e,
							{
								id : {
									value : "DWPlayer"
								},
								songs : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								stream : {
									value : null,
									writable : true
								},
								song : {
									value : null,
									writable : true
								},
								songvol : {
									value : 0,
									writable : true
								},
								master : {
									value : 0,
									writable : true
								},
								periods : {
									value : 0,
									writable : true
								},
								frqseqs : {
									value : 0,
									writable : true
								},
								volseqs : {
									value : 0,
									writable : true
								},
								transpose : {
									value : 0,
									writable : true
								},
								slower : {
									value : 0,
									writable : true
								},
								slowerCounter : {
									value : 0,
									writable : true
								},
								delaySpeed : {
									value : 0,
									writable : true
								},
								delayCounter : {
									value : 0,
									writable : true
								},
								fadeSpeed : {
									value : 0,
									writable : true
								},
								fadeCounter : {
									value : 0,
									writable : true
								},
								wave : {
									value : null,
									writable : true
								},
								waveCenter : {
									value : 0,
									writable : true
								},
								waveLo : {
									value : 0,
									writable : true
								},
								waveHi : {
									value : 0,
									writable : true
								},
								waveDir : {
									value : 0,
									writable : true
								},
								waveLen : {
									value : 0,
									writable : true
								},
								wavePos : {
									value : 0,
									writable : true
								},
								waveRateNeg : {
									value : 0,
									writable : true
								},
								waveRatePos : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								active : {
									value : 0,
									writable : true
								},
								complete : {
									value : 0,
									writable : true
								},
								variant : {
									value : 0,
									writable : true
								},
								base : {
									value : 0,
									writable : true
								},
								com2 : {
									value : 0,
									writable : true
								},
								com3 : {
									value : 0,
									writable : true
								},
								com4 : {
									value : 0,
									writable : true
								},
								readMix : {
									value : "",
									writable : true
								},
								readLen : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a, b, c = this.voices[this.active];
										this.reset();
										this.song = this.songs[this.playSong];
										this.songvol = this.master;
										this.speed = this.song.speed;
										this.transpose = 0;
										this.slowerCounter = 6;
										this.delaySpeed = this.song.delay;
										this.delayCounter = 0;
										this.fadeSpeed = 0;
										this.fadeCounter = 0;
										if (this.wave) {
											this.waveDir = 0;
											this.wavePos = this.wave.pointer
													+ this.waveCenter;
											a = this.wave.pointer;
											b = this.wavePos;
											for (; a < b; ++a)
												this.mixer.memory[a] = this.waveRateNeg;
											b += this.waveCenter;
											for (; a < b; ++a)
												this.mixer.memory[a] = this.waveRatePos
										}
										while (c) {
											c.initialize();
											c.channel = this.mixer.channels[c.index];
											c.sample = this.samples[0];
											this.complete += c.bitFlag;
											c.trackPtr = this.song.tracks[c.index];
											c.trackPos = this.readLen;
											this.stream.position = c.trackPtr;
											c.patternPos = this.base
													+ this.stream[this.readMix]
															();
											if (this.frqseqs) {
												this.stream.position = this.frqseqs;
												c.frqseqPtr = this.base
														+ this.stream
																.readUshort();
												c.frqseqPos = c.frqseqPtr
											}
											c = c.next
										}
									}
								},
								loader : {
									value : function(a) {
										var d, e, f, g, h, i, j, k, l = 10, m, n, o;
										this.master = 64;
										this.readMix = "readUshort";
										this.readLen = 2;
										this.variant = 0;
										if (a.readUshort() == 18663) {
											a.position = 4;
											if (a.readUshort() != 24832)
												return;
											a.position += a.readUshort();
											this.variant = 30
										} else {
											a.position = 0
										}
										while (o != 20085) {
											o = a.readUshort();
											switch (o) {
											case 18426:
												this.base = a.position
														+ a.readShort();
												break;
											case 24832:
												a.position += 2;
												h = a.position;
												if (a.readUshort() == 24832)
													h = a.position
															+ a.readUshort();
												break;
											case 49404:
												l = a.readUshort();
												if (l == 18) {
													this.readMix = "readUint";
													this.readLen = 4
												} else {
													this.variant = 10
												}
												if (a.readUshort() == 16890)
													e = a.position
															+ a.readUshort();
												if (a.readUshort() == 4656)
													d = 1;
												break;
											case 4656:
												a.position -= 6;
												if (a.readUshort() == 16890) {
													e = a.position
															+ a.readUshort();
													d = 1
												}
												a.position += 4;
												break;
											case 48764:
												this.channels = a.readUshort();
												a.position += 2;
												if (a.readUshort() == 14204)
													this.master = a
															.readUshort();
												break
											}
											if (a.bytesAvailable < 20)
												return
										}
										g = a.position;
										this.songs = [];
										i = 2147483647;
										n = 0;
										a.position = e;
										while (1) {
											m = c();
											m.tracks = new Uint32Array(
													this.channels);
											if (d) {
												m.speed = a.readUbyte();
												m.delay = a.readUbyte()
											} else {
												m.speed = a.readUshort()
											}
											if (m.speed > 255)
												break;
											for (f = 0; f < this.channels; ++f) {
												o = this.base
														+ a[this.readMix]();
												if (o < i)
													i = o;
												m.tracks[f] = o
											}
											this.songs[n++] = m;
											if (i - a.position < l)
												break
										}
										if (!n)
											return;
										this.lastSong = this.songs.length - 1;
										a.position = h;
										if (a.readUshort() != 18987)
											return;
										e = l = 0;
										this.wave = null;
										while (o != 20085) {
											o = a.readUshort();
											switch (o) {
											case 19450:
												if (e)
													break;
												h = a.position + a.readShort();
												a.position++;
												n = a.readUbyte();
												a.position -= 10;
												o = a.readUshort();
												j = a.position;
												if (o == 16890 || o == 8314) {
													e = a.position
															+ a.readUshort()
												} else if (o == 53500) {
													e = 64 + a.readUshort();
													a.position -= 18;
													e += a.position
															+ a.readUshort()
												}
												a.position = j;
												break;
											case 33987:
												if (l)
													break;
												a.position += 4;
												o = a.readUshort();
												if (o == 56060) {
													l = a.readUshort()
												} else if (o == 56316) {
													l = a.readUint()
												}
												if (l == 12
														&& this.variant < 30)
													this.variant = 20;
												j = a.position;
												this.samples = [];
												this.samples.length = ++n;
												a.position = e;
												for (f = 0; f < n; ++f) {
													k = b();
													k.length = a.readUint();
													k.relative = parseInt(3579545 / a
															.readUshort());
													k.pointer = this.mixer
															.store(a, k.length);
													o = a.position;
													a.position = h + f * l + 4;
													k.loopPtr = a.readInt();
													if (this.variant == 0) {
														a.position += 6;
														k.volume = a
																.readUshort()
													} else if (this.variant == 10) {
														a.position += 4;
														k.volume = a
																.readUshort();
														k.finetune = a
																.readByte()
													}
													a.position = o;
													this.samples[f] = k
												}
												this.mixer.loopLen = 64;
												a.length = e;
												a.position = j;
												break;
											case 8314:
												o = a.position + a.readShort();
												if (a.readUshort() != 12860) {
													a.position -= 2;
													break
												}
												this.wave = this.samples[parseInt((o - h)
														/ l)];
												this.waveCenter = a
														.readUshort() + 1 << 1;
												a.position += 2;
												this.waveRateNeg = a.readByte();
												a.position += 12;
												this.waveRatePos = a.readByte();
												break;
											case 1131:
											case 1643:
												n = a.readUshort();
												k = this.samples[parseInt((a
														.readUshort() - h)
														/ l)];
												if (o == 1643) {
													k.relative += n
												} else {
													k.relative -= n
												}
												break
											}
										}
										if (!this.samples.length)
											return;
										a.position = g;
										this.periods = 0;
										this.frqseqs = 0;
										this.volseqs = 0;
										this.slower = 0;
										this.com2 = 176;
										this.com3 = 160;
										this.com4 = 144;
										while (a.bytesAvailable > 16) {
											o = a.readUshort();
											switch (o) {
											case 18426:
												a.position += 2;
												if (a.readUshort() != 18987)
													break;
												j = a.position;
												a.position += 4;
												o = a.readUshort();
												if (o == 4154) {
													a.position += 4;
													if (a.readUshort() == 49404) {
														o = a.readUshort();
														n = this.songs.length;
														for (f = 0; f < n; ++f)
															this.songs[f].delay *= o;
														a.position += 6
													}
												} else if (o == 21291) {
													a.position -= 8
												}
												o = a.readUshort();
												if (o == 18987) {
													a.position = this.base
															+ a.readUshort();
													this.slower = a.readByte()
												}
												a.position = j;
												break;
											case 3179:
												a.position -= 6;
												o = a.readUshort();
												if (o == 21611 || o == 21099) {
													a.position += 4;
													this.waveHi = this.wave.pointer
															+ a.readUshort()
												} else if (o == 21867
														|| o == 21355) {
													a.position += 4;
													this.waveLo = this.wave.pointer
															+ a.readUshort()
												}
												this.waveLen = o < 21611 ? 1
														: 2;
												break;
											case 32256:
											case 32257:
											case 32258:
											case 32259:
												this.active = o & 15;
												n = this.channels - 1;
												if (this.active) {
													this.voices[0].next = null;
													for (f = n; f > 0;)
														this.voices[f].next = this.voices[--f]
												} else {
													this.voices[n].next = null;
													for (f = 0; f < n;)
														this.voices[f].next = this.voices[++f]
												}
												break;
											case 3176:
												a.position += 22;
												if (a.readUshort() == 3089)
													this.variant = 40;
												break;
											case 12845:
												j = a.position;
												o = a.readUshort();
												if (o == 10 || o == 12) {
													a.position -= 8;
													if (a.readUshort() == 17914)
														this.periods = a.position
																+ a
																		.readUshort()
												}
												a.position = j + 2;
												break;
											case 1024:
											case 1088:
											case 1536:
												o = a.readUshort();
												if (o == 192 || o == 64) {
													this.com2 = 192;
													this.com3 = 176;
													this.com4 = 160
												} else if (o == this.com3) {
													a.position += 2;
													if (a.readUshort() == 17914) {
														this.volseqs = a.position
																+ a
																		.readUshort();
														if (this.variant < 40)
															this.variant = 30
													}
												} else if (o == this.com4) {
													a.position += 2;
													if (a.readUshort() == 17914)
														this.frqseqs = a.position
																+ a
																		.readUshort()
												}
												break;
											case 20211:
												a.position += 2;
											case 20178:
												i = a.position;
												a.position -= 10;
												a.position += a.readUshort();
												j = a.position;
												a.position = j + 2;
												a.position = this.base
														+ a.readUshort() + 10;
												if (a.readUshort() == 18964)
													this.variant = 41;
												a.position = j + 16;
												o = this.base + a.readUshort();
												if (o > i && o < j) {
													a.position = o;
													o = a.readUshort();
													if (o == 20712) {
														this.variant = 21
													} else if (o == 5977) {
														this.variant = 11
													}
												}
												a.position = j + 20;
												o = this.base + a.readUshort();
												if (o > i && o < j) {
													a.position = o + 2;
													if (a.readUshort() != 18560)
														this.variant = 31
												}
												a.position = j + 26;
												o = a.readUshort();
												if (o > i && o < j)
													this.variant = 32;
												if (this.frqseqs)
													a.position = a.length;
												break
											}
										}
										if (!this.periods)
											return;
										this.com2 -= 256;
										this.com3 -= 256;
										this.com4 -= 256;
										this.stream = a;
										this.version = 1
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, f = this.voices[this.active], g;
										if (this.slower) {
											if (--this.slowerCounter == 0) {
												this.slowerCounter = 6;
												return
											}
										}
										if ((this.delayCounter += this.delaySpeed) > 255) {
											this.delayCounter -= 256;
											return
										}
										if (this.fadeSpeed) {
											if (--this.fadeCounter == 0) {
												this.fadeCounter = this.fadeSpeed;
												this.songvol--
											}
											if (!this.songvol) {
												if (!this.loopSong) {
													this.mixer.complete = 1;
													return
												} else {
													this.initialize()
												}
											}
										}
										if (this.wave) {
											if (this.waveDir) {
												this.mixer.memory[this.wavePos++] = this.waveRatePos;
												if (this.waveLen > 1)
													this.mixer.memory[this.wavePos++] = this.waveRatePos;
												if ((this.wavePos -= this.waveLen << 1) == this.waveLo)
													this.waveDir = 0
											} else {
												this.mixer.memory[this.wavePos++] = this.waveRateNeg;
												if (this.waveLen > 1)
													this.mixer.memory[this.wavePos++] = this.waveRateNeg;
												if (this.wavePos == this.waveHi)
													this.waveDir = 1
											}
										}
										while (f) {
											a = f.channel;
											this.stream.position = f.patternPos;
											d = f.sample;
											if (!f.busy) {
												f.busy = 1;
												if (d.loopPtr < 0) {
													a.pointer = this.mixer.loopPtr;
													a.length = this.mixer.loopLen
												} else {
													a.pointer = d.pointer
															+ d.loopPtr;
													a.length = d.length
															- d.loopPtr
												}
											}
											if (--f.tick == 0) {
												f.flags = 0;
												b = 1;
												while (b > 0) {
													e = this.stream.readByte();
													if (e < 0) {
														if (e >= -32) {
															f.speed = this.speed
																	* (e + 33)
														} else if (e >= this.com2) {
															e -= this.com2;
															f.sample = d = this.samples[e]
														} else if (e >= this.com3) {
															c = this.stream.position;
															this.stream.position = this.volseqs
																	+ (e
																			- this.com3 << 1);
															this.stream.position = this.base
																	+ this.stream
																			.readUshort();
															f.volseqPtr = this.stream.position;
															this.stream.position--;
															f.volseqSpeed = this.stream
																	.readUbyte();
															this.stream.position = c
														} else if (e >= this.com4) {
															c = this.stream.position;
															this.stream.position = this.frqseqs
																	+ (e
																			- this.com4 << 1);
															f.frqseqPtr = this.base
																	+ this.stream
																			.readUshort();
															f.frqseqPos = f.frqseqPtr;
															this.stream.position = c
														} else {
															switch (e) {
															case -128:
																this.stream.position = f.trackPtr
																		+ f.trackPos;
																e = this.stream[this.readMix]
																		();
																if (e) {
																	this.stream.position = this.base
																			+ e;
																	f.trackPos += this.readLen
																} else {
																	this.stream.position = f.trackPtr;
																	this.stream.position = this.base
																			+ this.stream[this.readMix]
																					();
																	f.trackPos = this.readLen;
																	if (!this.loopSong) {
																		this.complete &= ~f.bitFlag;
																		if (!this.complete)
																			this.mixer.complete = 1
																	}
																}
																break;
															case -127:
																if (this.variant > 0)
																	f.portaDelta = 0;
																f.portaSpeed = this.stream
																		.readByte();
																f.portaDelay = this.stream
																		.readUbyte();
																f.flags |= 2;
																break;
															case -126:
																f.tick = f.speed;
																f.patternPos = this.stream.position;
																if (this.variant == 41) {
																	f.busy = 1;
																	a.enabled = 0
																} else {
																	a.pointer = this.mixer.loopPtr;
																	a.length = this.mixer.loopLen
																}
																b = 0;
																break;
															case -125:
																if (this.variant > 0) {
																	f.tick = f.speed;
																	f.patternPos = this.stream.position;
																	a.enabled = 1;
																	b = 0
																}
																break;
															case -124:
																this.mixer.complete = 1;
																break;
															case -123:
																if (this.variant > 0)
																	this.transpose = this.stream
																			.readByte();
																break;
															case -122:
																f.vibrato = -1;
																f.vibratoSpeed = this.stream
																		.readUbyte();
																f.vibratoDepth = this.stream
																		.readUbyte();
																f.vibratoDelta = 0;
																break;
															case -121:
																f.vibrato = 0;
																break;
															case -120:
																if (this.variant == 21) {
																	f.halve = 1
																} else if (this.variant == 11) {
																	this.fadeSpeed = this.stream
																			.readUbyte()
																} else {
																	f.transpose = this.stream
																			.readByte()
																}
																break;
															case -119:
																if (this.variant == 21) {
																	f.halve = 0
																} else {
																	f.trackPtr = this.base
																			+ this.stream
																					.readUshort();
																	f.trackPos = 0
																}
																break;
															case -118:
																if (this.variant == 31) {
																	this.delaySpeed = this.stream
																			.readUbyte()
																} else {
																	this.speed = this.stream
																			.readUbyte()
																}
																break;
															case -117:
																this.fadeSpeed = this.stream
																		.readUbyte();
																this.fadeCounter = this.fadeSpeed;
																break;
															case -116:
																e = this.stream
																		.readUbyte();
																if (this.variant != 32)
																	this.songvol = e;
																break
															}
														}
													} else {
														f.patternPos = this.stream.position;
														f.note = e += d.finetune;
														f.tick = f.speed;
														f.busy = 0;
														if (this.variant >= 20) {
															e = e
																	+ this.transpose
																	+ f.transpose
																	& 255;
															this.stream.position = f.volseqPtr;
															g = this.stream
																	.readUbyte();
															f.volseqPos = this.stream.position;
															f.volseqCounter = f.volseqSpeed;
															if (f.halve)
																g >>= 1;
															g = g
																	* this.songvol >> 6
														} else {
															g = d.volume
														}
														a.pointer = d.pointer;
														a.length = d.length;
														a.volume = g;
														this.stream.position = this.periods
																+ (e << 1);
														e = this.stream
																.readUshort()
																* d.relative >> 10;
														if (this.variant < 10)
															f.portaDelta = e;
														a.period = e;
														a.enabled = 1;
														b = 0
													}
												}
											} else if (f.tick == 1) {
												if (this.variant < 30) {
													a.enabled = 0
												} else {
													e = this.stream.readUbyte();
													if (e != 131) {
														if (this.variant < 40
																|| e < 224
																|| this.stream
																		.readUbyte() != 131)
															a.enabled = 0
													}
												}
											} else if (this.variant == 0) {
												if (f.flags & 2) {
													if (f.portaDelay) {
														f.portaDelay--
													} else {
														f.portaDelta -= f.portaSpeed;
														a.period = f.portaDelta
													}
												}
											} else {
												this.stream.position = f.frqseqPos;
												e = this.stream.readByte();
												if (e < 0) {
													e &= 127;
													this.stream.position = f.frqseqPtr
												}
												f.frqseqPos = this.stream.position;
												e = e + f.note + this.transpose
														+ f.transpose & 255;
												this.stream.position = this.periods
														+ (e << 1);
												e = this.stream.readUshort()
														* d.relative >> 10;
												if (f.flags & 2) {
													if (f.portaDelay) {
														f.portaDelay--
													} else {
														f.portaDelta += f.portaSpeed;
														e -= f.portaDelta
													}
												}
												if (f.vibrato) {
													if (f.vibrato > 0) {
														f.vibratoDelta -= f.vibratoSpeed;
														if (!f.vibratoDelta)
															f.vibrato ^= 2147483648
													} else {
														f.vibratoDelta += f.vibratoSpeed;
														if (f.vibratoDelta == f.vibratoDepth)
															f.vibrato ^= 2147483648
													}
													if (!f.vibratoDelta)
														f.vibrato ^= 1;
													if (f.vibrato & 1) {
														e += f.vibratoDelta
													} else {
														e -= f.vibratoDelta
													}
												}
												a.period = e;
												if (this.variant >= 20) {
													if (--f.volseqCounter < 0) {
														this.stream.position = f.volseqPos;
														g = this.stream
																.readByte();
														if (g >= 0)
															f.volseqPos = this.stream.position;
														f.volseqCounter = f.volseqSpeed;
														g &= 127;
														if (f.halve)
															g >>= 1;
														a.volume = g
																* this.songvol >> 6
													}
												}
											}
											f = f.next
										}
									}
								}
							});
			e.voices[0] = a(0, 1);
			e.voices[1] = a(1, 2);
			e.voices[2] = a(2, 4);
			e.voices[3] = a(3, 8);
			return Object.seal(e)
		}
		window.neoart.DWPlayer = d
	})();
	(function() {
		function b(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				pattern : {
					value : 0,
					writable : true
				},
				soundTranspose : {
					value : 0,
					writable : true
				},
				transpose : {
					value : 0,
					writable : true
				},
				patStep : {
					value : 0,
					writable : true
				},
				frqStep : {
					value : 0,
					writable : true
				},
				frqPos : {
					value : 0,
					writable : true
				},
				frqSustain : {
					value : 0,
					writable : true
				},
				frqTranspose : {
					value : 0,
					writable : true
				},
				volStep : {
					value : 0,
					writable : true
				},
				volPos : {
					value : 0,
					writable : true
				},
				volCtr : {
					value : 0,
					writable : true
				},
				volSpeed : {
					value : 0,
					writable : true
				},
				volSustain : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				pitch : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				pitchBendFlag : {
					value : 0,
					writable : true
				},
				pitchBendSpeed : {
					value : 0,
					writable : true
				},
				pitchBendTime : {
					value : 0,
					writable : true
				},
				portamentoFlag : {
					value : 0,
					writable : true
				},
				portamento : {
					value : 0,
					writable : true
				},
				volBendFlag : {
					value : 0,
					writable : true
				},
				volBendSpeed : {
					value : 0,
					writable : true
				},
				volBendTime : {
					value : 0,
					writable : true
				},
				vibratoFlag : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				vibratoDepth : {
					value : 0,
					writable : true
				},
				vibratoDelay : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.sample = null;
						this.enabled = 0;
						this.pattern = 0;
						this.soundTranspose = 0;
						this.transpose = 0;
						this.patStep = 0;
						this.frqStep = 0;
						this.frqPos = 0;
						this.frqSustain = 0;
						this.frqTranspose = 0;
						this.volStep = 0;
						this.volPos = 0;
						this.volCtr = 1;
						this.volSpeed = 1;
						this.volSustain = 0;
						this.note = 0;
						this.pitch = 0;
						this.volume = 0;
						this.pitchBendFlag = 0;
						this.pitchBendSpeed = 0;
						this.pitchBendTime = 0;
						this.portamentoFlag = 0;
						this.portamento = 0;
						this.volBendFlag = 0;
						this.volBendSpeed = 0;
						this.volBendTime = 0;
						this.vibratoFlag = 0;
						this.vibratoSpeed = 0;
						this.vibratoDepth = 0;
						this.vibratoDelay = 0;
						this.vibrato = 0
					}
				},
				volumeBend : {
					value : function() {
						this.volBendFlag ^= 1;
						if (this.volBendFlag) {
							this.volBendTime--;
							this.volume += this.volBendSpeed;
							if (this.volume < 0 || this.volume > 64)
								this.volBendTime = 0
						}
					}
				}
			})
		}
		function c(c) {
			var h = l(c);
			Object
					.defineProperties(
							h,
							{
								id : {
									value : "FCPlayer"
								},
								seqs : {
									value : null,
									writable : true
								},
								pats : {
									value : null,
									writable : true
								},
								vols : {
									value : null,
									writable : true
								},
								frqs : {
									value : null,
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.seqs.position = 0;
										this.pats.position = 0;
										this.vols.position = 0;
										this.frqs.position = 0;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.pattern = this.seqs.readUbyte() << 6;
											a.transpose = this.seqs.readByte();
											a.soundTranspose = this.seqs
													.readByte();
											a = a.next
										}
										this.speed = this.seqs.readUbyte();
										if (!this.speed)
											this.speed = 3;
										this.tick = this.speed
									}
								},
								loader : {
									value : function(b) {
										var c, f, h, j, k, l, m, n, o, p;
										f = b.readString(4);
										if (f == "SMOD")
											this.version = d;
										else if (f == "FC14")
											this.version = e;
										else
											return;
										b.position = 4;
										this.length = b.readUint();
										b.position = this.version == d ? 100
												: 180;
										this.seqs = a(new ArrayBuffer(
												this.length));
										b.readBytes(this.seqs, 0, this.length);
										this.length = this.length / 13 >> 0;
										b.position = 12;
										j = b.readUint();
										b.position = 8;
										b.position = b.readUint();
										this.pats = a(new ArrayBuffer(j + 1));
										b.readBytes(this.pats, 0, j);
										b.position = 20;
										j = b.readUint();
										b.position = 16;
										b.position = b.readUint();
										this.frqs = a(new ArrayBuffer(j + 9));
										this.frqs.writeInt(16777216);
										this.frqs.writeInt(225);
										b.readBytes(this.frqs, 8, j);
										this.frqs.position = this.frqs.length - 1;
										this.frqs.writeByte(225);
										this.frqs.position = 0;
										b.position = 28;
										j = b.readUint();
										b.position = 24;
										b.position = b.readUint();
										this.vols = a(new ArrayBuffer(j + 8));
										this.vols.writeInt(16777216);
										this.vols.writeInt(225);
										b.readBytes(this.vols, 8, j);
										b.position = 32;
										n = b.readUint();
										b.position = 40;
										if (this.version == d) {
											this.samples.length = 57, k = 0
										} else {
											this.samples.length = 200;
											k = 2
										}
										for (c = 0; c < 10; ++c) {
											j = b.readUshort() << 1;
											if (j > 0) {
												l = b.position;
												b.position = n;
												f = b.readString(4);
												if (f == "SSMP") {
													o = j;
													for (h = 0; h < 10; ++h) {
														b.readInt();
														j = b.readUshort() << 1;
														if (j > 0) {
															m = i();
															m.length = j + 2;
															m.loop = b
																	.readUshort();
															m.repeat = b
																	.readUshort() << 1;
															if (m.loop
																	+ m.repeat > m.length)
																m.repeat = m.length
																		- m.loop;
															if (n + m.length > b.length)
																m.length = b.length
																		- n;
															m.pointer = this.mixer
																	.store(
																			b,
																			m.length,
																			n
																					+ p);
															m.loopPtr = m.pointer
																	+ m.loop;
															this.samples[100
																	+ c * 10
																	+ h] = m;
															p += m.length;
															b.position += 6
														} else {
															b.position += 10
														}
													}
													n += o + 2;
													b.position = l + 4
												} else {
													b.position = l;
													m = i();
													m.length = j + k;
													m.loop = b.readUshort();
													m.repeat = b.readUshort() << 1;
													if (m.loop + m.repeat > m.length)
														m.repeat = m.length
																- m.loop;
													if (n + m.length > b.length)
														m.length = b.length - n;
													m.pointer = this.mixer
															.store(b, m.length,
																	n);
													m.loopPtr = m.pointer
															+ m.loop;
													this.samples[c] = m;
													n += m.length
												}
											} else {
												b.position += 4
											}
										}
										if (this.version == d) {
											k = 0;
											o = 47;
											for (c = 10; c < 57; ++c) {
												m = i();
												m.length = g[k++] << 1;
												m.loop = 0;
												m.repeat = m.length;
												l = this.mixer.memory.length;
												m.pointer = l;
												m.loopPtr = l;
												this.samples[c] = m;
												j = l + m.length;
												for (h = l; h < j; ++h)
													this.mixer.memory[h] = g[o++]
											}
										} else {
											b.position = 36;
											n = b.readUint();
											b.position = 100;
											for (c = 10; c < 90; ++c) {
												j = b.readUbyte() << 1;
												if (j < 2)
													continue;
												m = i();
												m.length = j;
												m.loop = 0;
												m.repeat = m.length;
												if (n + m.length > b.length)
													m.length = b.length - n;
												m.pointer = this.mixer.store(b,
														m.length, n);
												m.loopPtr = m.pointer;
												this.samples[c] = m;
												n += m.length
											}
										}
										this.length *= 13
									}
								},
								process : {
									value : function() {
										var a, b, c, e, g, h, i, j, k, l, m = this.voices[0];
										if (--this.tick == 0) {
											a = this.seqs.position;
											while (m) {
												b = m.channel;
												this.pats.position = m.pattern
														+ m.patStep;
												l = this.pats.readUbyte();
												if (m.patStep >= 64 || l == 73) {
													if (this.seqs.position == this.length) {
														this.seqs.position = 0;
														this.mixer.complete = 1
													}
													m.patStep = 0;
													m.pattern = this.seqs
															.readUbyte() << 6;
													m.transpose = this.seqs
															.readByte();
													m.soundTranspose = this.seqs
															.readByte();
													this.pats.position = m.pattern;
													l = this.pats.readUbyte()
												}
												g = this.pats.readUbyte();
												this.frqs.position = 0;
												this.vols.position = 0;
												if (l != 0) {
													m.note = l & 127;
													m.pitch = 0;
													m.portamento = 0;
													m.enabled = b.enabled = 0;
													l = 8 + ((g & 63)
															+ m.soundTranspose << 6);
													if (l >= 0
															&& l < this.vols.length)
														this.vols.position = l;
													m.volStep = 0;
													m.volSpeed = m.volCtr = this.vols
															.readUbyte();
													m.volSustain = 0;
													m.frqPos = 8 + (this.vols
															.readUbyte() << 6);
													m.frqStep = 0;
													m.frqSustain = 0;
													m.vibratoFlag = 0;
													m.vibratoSpeed = this.vols
															.readUbyte();
													m.vibratoDepth = m.vibrato = this.vols
															.readUbyte();
													m.vibratoDelay = this.vols
															.readUbyte();
													m.volPos = this.vols.position
												}
												if (g & 64) {
													m.portamento = 0
												} else if (g & 128) {
													m.portamento = this.pats[this.pats.position + 1];
													if (this.version == d)
														m.portamento <<= 1
												}
												m.patStep += 2;
												m = m.next
											}
											if (this.seqs.position != a) {
												l = this.seqs.readUbyte();
												if (l)
													this.speed = l
											}
											this.tick = this.speed
										}
										m = this.voices[0];
										while (m) {
											b = m.channel;
											do {
												i = 0;
												if (m.frqSustain) {
													m.frqSustain--;
													break
												}
												this.frqs.position = m.frqPos
														+ m.frqStep;
												do {
													h = 0;
													if (!this.frqs.bytesAvailable)
														break;
													g = this.frqs.readUbyte();
													if (g == 225)
														break;
													if (g == 224) {
														m.frqStep = this.frqs
																.readUbyte() & 63;
														this.frqs.position = m.frqPos
																+ m.frqStep;
														g = this.frqs
																.readUbyte()
													}
													switch (g) {
													case 226:
														b.enabled = 0;
														m.enabled = 1;
														m.volCtr = 1;
														m.volStep = 0;
													case 228:
														k = this.samples[this.frqs
																.readUbyte()];
														if (k) {
															b.pointer = k.pointer;
															b.length = k.length
														} else {
															m.enabled = 0
														}
														m.sample = k;
														m.frqStep += 2;
														break;
													case 233:
														l = 100 + this.frqs
																.readUbyte() * 10;
														k = this.samples[l
																+ this.frqs
																		.readUbyte()];
														if (k) {
															b.enabled = 0;
															b.pointer = k.pointer;
															b.length = k.length;
															m.enabled = 1
														}
														m.sample = k;
														m.volCtr = 1;
														m.volStep = 0;
														m.frqStep += 3;
														break;
													case 231:
														h = 1;
														m.frqPos = 8 + (this.frqs
																.readUbyte() << 6);
														if (m.frqPos >= this.frqs.length)
															m.frqPos = 0;
														m.frqStep = 0;
														this.frqs.position = m.frqPos;
														break;
													case 234:
														m.pitchBendSpeed = this.frqs
																.readByte();
														m.pitchBendTime = this.frqs
																.readUbyte();
														m.frqStep += 3;
														break;
													case 232:
														i = 1;
														m.frqSustain = this.frqs
																.readUbyte();
														m.frqStep += 2;
														break;
													case 227:
														m.vibratoSpeed = this.frqs
																.readUbyte();
														m.vibratoDepth = this.frqs
																.readUbyte();
														m.frqStep += 3;
														break
													}
													if (!i && !h) {
														this.frqs.position = m.frqPos
																+ m.frqStep;
														m.frqTranspose = this.frqs
																.readByte();
														m.frqStep++
													}
												} while (h)
											} while (i);
											if (m.volSustain) {
												m.volSustain--
											} else {
												if (m.volBendTime) {
													m.volumeBend()
												} else {
													if (--m.volCtr == 0) {
														m.volCtr = m.volSpeed;
														do {
															h = 0;
															this.vols.position = m.volPos
																	+ m.volStep;
															if (!this.vols.bytesAvailable)
																break;
															g = this.vols
																	.readUbyte();
															if (g == 225)
																break;
															switch (g) {
															case 234:
																m.volBendSpeed = this.vols
																		.readByte();
																m.volBendTime = this.vols
																		.readUbyte();
																m.volStep += 3;
																m.volumeBend();
																break;
															case 232:
																m.volSustain = this.vols
																		.readUbyte();
																m.volStep += 2;
																break;
															case 224:
																h = 1;
																l = this.vols
																		.readUbyte() & 63;
																m.volStep = l - 5;
																break;
															default:
																m.volume = g;
																m.volStep++;
																break
															}
														} while (h)
													}
												}
											}
											g = m.frqTranspose;
											if (g >= 0)
												g += m.note + m.transpose;
											g &= 127;
											j = f[g];
											if (m.vibratoDelay) {
												m.vibratoDelay--
											} else {
												l = m.vibrato;
												if (m.vibratoFlag) {
													c = m.vibratoDepth << 1;
													l += m.vibratoSpeed;
													if (l > c) {
														l = c;
														m.vibratoFlag = 0
													}
												} else {
													l -= m.vibratoSpeed;
													if (l < 0) {
														l = 0;
														m.vibratoFlag = 1
													}
												}
												m.vibrato = l;
												l -= m.vibratoDepth;
												a = (g << 1) + 160;
												while (a < 256) {
													l <<= 1;
													a += 24
												}
												j += l
											}
											m.portamentoFlag ^= 1;
											if (m.portamentoFlag
													&& m.portamento) {
												if (m.portamento > 31)
													m.pitch += m.portamento & 31;
												else
													m.pitch -= m.portamento
											}
											m.pitchBendFlag ^= 1;
											if (m.pitchBendFlag
													&& m.pitchBendTime) {
												m.pitchBendTime--;
												m.pitch -= m.pitchBendSpeed
											}
											j += m.pitch;
											if (j < 113)
												j = 113;
											else if (j > 3424)
												j = 3424;
											b.period = j;
											b.volume = m.volume;
											if (m.sample) {
												k = m.sample;
												b.enabled = m.enabled;
												b.pointer = k.loopPtr;
												b.length = k.repeat
											}
											m = m.next
										}
									}
								}
							});
			h.voices[0] = b(0);
			h.voices[0].next = h.voices[1] = b(1);
			h.voices[1].next = h.voices[2] = b(2);
			h.voices[2].next = h.voices[3] = b(3);
			return Object.seal(h)
		}
		var d = 1, e = 2, f = [ 1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140,
				1076, 1016, 960, 906, 856, 808, 762, 720, 678, 640, 604, 570,
				538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302, 285,
				269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143,
				135, 127, 120, 113, 113, 113, 113, 113, 113, 113, 113, 113,
				113, 113, 113, 113, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
				2280, 2152, 2032, 1920, 1812, 1712, 1616, 1524, 1440, 1356,
				1280, 1208, 1140, 1076, 1016, 960, 906, 856, 808, 762, 720,
				678, 640, 604, 570, 538, 508, 480, 453, 428, 404, 381, 360,
				339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
				170, 160, 151, 143, 135, 127, 120, 113, 113, 113, 113, 113,
				113, 113, 113, 113, 113, 113, 113, 113 ], g = [ 16, 16, 16, 16,
				16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
				16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 8, 8, 8, 8, 8,
				8, 8, 8, 16, 8, 16, 16, 8, 8, 24, -64, -64, -48, -40, -32, -24,
				-16, -8, 0, -8, -16, -24, -32, -40, -48, -56, 63, 55, 47, 39,
				31, 23, 15, 7, -1, 7, 15, 23, 31, 39, 47, 55, -64, -64, -48,
				-40, -32, -24, -16, -8, 0, -8, -16, -24, -32, -40, -48, -56,
				-64, 55, 47, 39, 31, 23, 15, 7, -1, 7, 15, 23, 31, 39, 47, 55,
				-64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
				-40, -48, -56, -64, -72, 47, 39, 31, 23, 15, 7, -1, 7, 15, 23,
				31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8,
				-16, -24, -32, -40, -48, -56, -64, -72, -80, 39, 31, 23, 15, 7,
				-1, 7, 15, 23, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24,
				-16, -8, 0, -8, -16, -24, -32, -40, -48, -56, -64, -72, -80,
				-88, 31, 23, 15, 7, -1, 7, 15, 23, 31, 39, 47, 55, -64, -64,
				-48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32, -40, -48,
				-56, -64, -72, -80, -88, -96, 23, 15, 7, -1, 7, 15, 23, 31, 39,
				47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24,
				-32, -40, -48, -56, -64, -72, -80, -88, -96, -104, 15, 7, -1,
				7, 15, 23, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16,
				-8, 0, -8, -16, -24, -32, -40, -48, -56, -64, -72, -80, -88,
				-96, -104, -112, 7, -1, 7, 15, 23, 31, 39, 47, 55, -64, -64,
				-48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32, -40, -48,
				-56, -64, -72, -80, -88, -96, -104, -112, -120, -1, 7, 15, 23,
				31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8,
				-16, -24, -32, -40, -48, -56, -64, -72, -80, -88, -96, -104,
				-112, -120, -128, 7, 15, 23, 31, 39, 47, 55, -64, -64, -48,
				-40, -32, -24, -16, -8, 0, -8, -16, -24, -32, -40, -48, -56,
				-64, -72, -80, -88, -96, -104, -112, -120, -128, -120, 15, 23,
				31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16, -8, 0, -8,
				-16, -24, -32, -40, -48, -56, -64, -72, -80, -88, -96, -104,
				-112, -120, -128, -120, -112, 23, 31, 39, 47, 55, -64, -64,
				-48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32, -40, -48,
				-56, -64, -72, -80, -88, -96, -104, -112, -120, -128, -120,
				-112, -104, 31, 39, 47, 55, -64, -64, -48, -40, -32, -24, -16,
				-8, 0, -8, -16, -24, -32, -40, -48, -56, -64, -72, -80, -88,
				-96, -104, -112, -120, -128, -120, -112, -104, -96, 39, 47, 55,
				-64, -64, -48, -40, -32, -24, -16, -8, 0, -8, -16, -24, -32,
				-40, -48, -56, -64, -72, -80, -88, -96, -104, -112, -120, -128,
				-120, -112, -104, -96, -88, 47, 55, -64, -64, -48, -40, -32,
				-24, -16, -8, 0, -8, -16, -24, -32, -40, -48, -56, -64, -72,
				-80, -88, -96, -104, -112, -120, -128, -120, -112, -104, -96,
				-88, -80, 55, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
				127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, 127, 127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, 127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				127, 127, 127, 127, 127, 127, 127, 127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, 127, 127, 127, 127, 127, 127, 127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, 127, 127, 127, 127, 127, 127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, 127, 127, 127, 127, 127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, 127, 127, 127, 127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, -127,
				-127, -127, -127, -127, -127, -127, -127, -127, -127, 127, 127,
				127, -128, -128, -128, -128, -128, -128, -128, -128, -128,
				-128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
				-128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
				-128, 127, 127, -128, -128, -128, -128, -128, -128, -128, -128,
				-128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
				-128, -128, -128, -128, -128, -128, -128, -128, -128, -128,
				-128, -128, -128, 127, -128, -128, -128, -128, -128, -128,
				-128, -128, 127, 127, 127, 127, 127, 127, 127, 127, -128, -128,
				-128, -128, -128, -128, -128, 127, 127, 127, 127, 127, 127,
				127, 127, 127, -128, -128, -128, -128, -128, -128, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, -128, -128, -128, -128,
				-128, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
				-128, -128, -128, -128, 127, 127, 127, 127, 127, 127, 127, 127,
				127, 127, 127, 127, -128, -128, -128, 127, 127, 127, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, -128, -128, 127, 127,
				127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
				-128, -128, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127,
				127, 127, 127, 127, -128, -128, -112, -104, -96, -88, -80, -72,
				-64, -56, -48, -40, -32, -24, -16, -8, 0, 8, 16, 24, 32, 40,
				48, 56, 64, 72, 80, 88, 96, 104, 112, 127, -128, -128, -96,
				-80, -64, -48, -32, -16, 0, 16, 32, 48, 64, 80, 96, 112, 69,
				69, 121, 125, 122, 119, 112, 102, 97, 88, 83, 77, 44, 32, 24,
				18, 4, -37, -45, -51, -58, -68, -75, -82, -88, -93, -99, -103,
				-109, -114, -117, -118, 69, 69, 121, 125, 122, 119, 112, 102,
				91, 75, 67, 55, 44, 32, 24, 18, 4, -8, -24, -37, -49, -58, -66,
				-80, -88, -92, -98, -102, -107, -108, -115, -125, 0, 0, 64, 96,
				127, 96, 64, 32, 0, -32, -64, -96, -128, -96, -64, -32, 0, 0,
				64, 96, 127, 96, 64, 32, 0, -32, -64, -96, -128, -96, -64, -32,
				-128, -128, -112, -104, -96, -88, -80, -72, -64, -56, -48, -40,
				-32, -24, -16, -8, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80,
				88, 96, 104, 112, 127, -128, -128, -96, -80, -64, -48, -32,
				-16, 0, 16, 32, 48, 64, 80, 96, 112 ];
		window.neoart.FCPlayer = c
	})();
	(function() {
		function b(a, b) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				bitFlag : {
					value : b,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				tick : {
					value : 0,
					writable : true
				},
				busy : {
					value : 0,
					writable : true
				},
				synth : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				envelopePos : {
					value : 0,
					writable : true
				},
				sustainTime : {
					value : 0,
					writable : true
				},
				arpeggioPos : {
					value : 0,
					writable : true
				},
				arpeggioSpeed : {
					value : 0,
					writable : true
				},
				portamento : {
					value : 0,
					writable : true
				},
				portaCounter : {
					value : 0,
					writable : true
				},
				portaDelay : {
					value : 0,
					writable : true
				},
				portaFlag : {
					value : 0,
					writable : true
				},
				portaLimit : {
					value : 0,
					writable : true
				},
				portaNote : {
					value : 0,
					writable : true
				},
				portaPeriod : {
					value : 0,
					writable : true
				},
				portaSpeed : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				vibratoDelay : {
					value : 0,
					writable : true
				},
				vibratoDepth : {
					value : 0,
					writable : true
				},
				vibratoFlag : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				pulseCounter : {
					value : 0,
					writable : true
				},
				pulseDelay : {
					value : 0,
					writable : true
				},
				pulseDir : {
					value : 0,
					writable : true
				},
				pulsePos : {
					value : 0,
					writable : true
				},
				pulseSpeed : {
					value : 0,
					writable : true
				},
				blendCounter : {
					value : 0,
					writable : true
				},
				blendDelay : {
					value : 0,
					writable : true
				},
				blendDir : {
					value : 0,
					writable : true
				},
				blendPos : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.trackPos = 0;
						this.patternPos = 0;
						this.tick = 1;
						this.busy = 1;
						this.note = 0;
						this.period = 0;
						this.volume = 0;
						this.envelopePos = 0;
						this.sustainTime = 0;
						this.arpeggioPos = 0;
						this.arpeggioSpeed = 0;
						this.portamento = 0;
						this.portaCounter = 0;
						this.portaDelay = 0;
						this.portaFlag = 0;
						this.portaLimit = 0;
						this.portaNote = 0;
						this.portaPeriod = 0;
						this.portaSpeed = 0;
						this.vibrato = 0;
						this.vibratoDelay = 0;
						this.vibratoDepth = 0;
						this.vibratoFlag = 0;
						this.vibratoSpeed = 0;
						this.pulseCounter = 0;
						this.pulseDelay = 0;
						this.pulseDir = 0;
						this.pulsePos = 0;
						this.pulseSpeed = 0;
						this.blendCounter = 0;
						this.blendDelay = 0;
						this.blendDir = 0;
						this.blendPos = 0
					}
				}
			})
		}
		function c() {
			return Object.create(null, {
				pointer : {
					value : 0,
					writable : true
				},
				loopPtr : {
					value : 0,
					writable : true
				},
				length : {
					value : 0,
					writable : true
				},
				relative : {
					value : 0,
					writable : true
				},
				type : {
					value : 0,
					writable : true
				},
				synchro : {
					value : 0,
					writable : true
				},
				envelopeVol : {
					value : 0,
					writable : true
				},
				attackSpeed : {
					value : 0,
					writable : true
				},
				attackVol : {
					value : 0,
					writable : true
				},
				decaySpeed : {
					value : 0,
					writable : true
				},
				decayVol : {
					value : 0,
					writable : true
				},
				sustainTime : {
					value : 0,
					writable : true
				},
				releaseSpeed : {
					value : 0,
					writable : true
				},
				releaseVol : {
					value : 0,
					writable : true
				},
				arpeggio : {
					value : null,
					writable : true
				},
				arpeggioLimit : {
					value : 0,
					writable : true
				},
				arpeggioSpeed : {
					value : 0,
					writable : true
				},
				vibratoDelay : {
					value : 0,
					writable : true
				},
				vibratoDepth : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				pulseCounter : {
					value : 0,
					writable : true
				},
				pulseDelay : {
					value : 0,
					writable : true
				},
				pulsePosL : {
					value : 0,
					writable : true
				},
				pulsePosH : {
					value : 0,
					writable : true
				},
				pulseSpeed : {
					value : 0,
					writable : true
				},
				pulseRateNeg : {
					value : 0,
					writable : true
				},
				pulseRatePos : {
					value : 0,
					writable : true
				},
				blendCounter : {
					value : 0,
					writable : true
				},
				blendDelay : {
					value : 0,
					writable : true
				},
				blendRate : {
					value : 0,
					writable : true
				}
			})
		}
		function d() {
			return Object.create(null, {
				speed : {
					value : 0,
					writable : true
				},
				length : {
					value : 0,
					writable : true
				},
				tracks : {
					value : [],
					writable : true
				}
			})
		}
		function e(e) {
			var g = l(e);
			Object
					.defineProperties(
							g,
							{
								id : {
									value : "FEPlayer"
								},
								songs : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								patterns : {
									value : null,
									writable : true
								},
								song : {
									value : null,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								complete : {
									value : 0,
									writable : true
								},
								sampFlag : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a, b, c = this.voices[3];
										this.reset();
										this.song = this.songs[this.playSong];
										this.speed = this.song.speed;
										this.complete = 15;
										while (c) {
											c.initialize();
											c.channel = this.mixer.channels[c.index];
											c.patternPos = this.song.tracks[c.index][0];
											a = c.synth;
											b = a + 64;
											for (; a < b; ++a)
												this.mixer.memory[a] = 0;
											c = c.next
										}
									}
								},
								loader : {
									value : function(b) {
										var e, f, g, h, i, j, k, l, m, n, o, p;
										while (b.position < 16) {
											p = b.readUshort();
											b.position += 2;
											if (p != 20218)
												return
										}
										while (b.position < 1024) {
											p = b.readUshort();
											if (p == 4666) {
												b.position += 2;
												p = b.readUshort();
												if (p == 45057) {
													b.position -= 4;
													f = b.position
															+ b.readUshort()
															- 2197
												}
											} else if (p == 8522) {
												b.position += 2;
												p = b.readUshort();
												if (p == 18426) {
													e = b.position
															+ b.readShort();
													this.version = 1;
													break
												}
											}
										}
										if (!this.version)
											return;
										b.position = f + 2210;
										j = b.readUint();
										b.position = e + j;
										this.samples = [];
										j = 2147483647;
										while (j > b.position) {
											p = b.readUint();
											if (p) {
												if (p < b.position
														|| p >= b.length) {
													b.position -= 4;
													break
												}
												if (p < j)
													j = e + p
											}
											l = c();
											l.pointer = p;
											l.loopPtr = b.readShort();
											l.length = b.readUshort() << 1;
											l.relative = b.readUshort();
											l.vibratoDelay = b.readUbyte();
											b.position++;
											l.vibratoSpeed = b.readUbyte();
											l.vibratoDepth = b.readUbyte();
											l.envelopeVol = b.readUbyte();
											l.attackSpeed = b.readUbyte();
											l.attackVol = b.readUbyte();
											l.decaySpeed = b.readUbyte();
											l.decayVol = b.readUbyte();
											l.sustainTime = b.readUbyte();
											l.releaseSpeed = b.readUbyte();
											l.releaseVol = b.readUbyte();
											l.arpeggio = new Int8Array(16);
											for (g = 0; g < 16; ++g)
												l.arpeggio[g] = b.readByte();
											l.arpeggioSpeed = b.readUbyte();
											l.type = b.readByte();
											l.pulseRateNeg = b.readByte();
											l.pulseRatePos = b.readUbyte();
											l.pulseSpeed = b.readUbyte();
											l.pulsePosL = b.readUbyte();
											l.pulsePosH = b.readUbyte();
											l.pulseDelay = b.readUbyte();
											l.synchro = b.readUbyte();
											l.blendRate = b.readUbyte();
											l.blendDelay = b.readUbyte();
											l.pulseCounter = b.readUbyte();
											l.blendCounter = b.readUbyte();
											l.arpeggioLimit = b.readUbyte();
											b.position += 12;
											this.samples.push(l);
											if (!b.bytesAvailable)
												break
										}
										if (j != 2147483647) {
											this.mixer.store(b, b.length - j);
											i = this.samples.length;
											for (g = 0; g < i; ++g) {
												l = this.samples[g];
												if (l.pointer)
													l.pointer -= e + j
											}
										}
										j = this.mixer.memory.length;
										this.mixer.memory.length += 256;
										this.mixer.loopLen = 100;
										for (g = 0; g < 4; ++g) {
											this.voices[g].synth = j;
											j += 64
										}
										b.position = f + 2210;
										i = b.readUint();
										j = b.readUint();
										b.position = e + j;
										this.patterns = a(new ArrayBuffer(i - j));
										b.readBytes(this.patterns, 0, i - j);
										j += e;
										b.position = f + 2197;
										this.lastSong = i = b.readUbyte();
										this.songs = [];
										this.songs.length = ++i;
										e = f + 2830;
										o = j - e;
										j = 0;
										for (g = 0; g < i; ++g) {
											n = d();
											n.tracks = [];
											for (h = 0; h < 4; ++h) {
												b.position = e + j;
												p = b.readUshort();
												if (h == 3 && g == i - 1)
													m = o;
												else
													m = b.readUshort();
												m = m - p >> 1;
												if (m > n.length)
													n.length = m;
												n.tracks[h] = new Uint32Array(m);
												b.position = e + p;
												for (k = 0; k < m; ++k)
													n.tracks[h][k] = b
															.readUshort();
												j += 2
											}
											b.position = f + 2199 + g;
											n.speed = b.readUbyte();
											this.songs[g] = n
										}
										b.clear();
										b = null
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, g, h, i, j = this.voices[3];
										while (j) {
											a = j.channel;
											e = 0;
											do {
												this.patterns.position = j.patternPos;
												h = j.sample;
												this.sampFlag = 0;
												if (!j.busy) {
													j.busy = 1;
													if (h.loopPtr == 0) {
														a.pointer = this.mixer.loopPtr;
														a.length = this.mixer.loopLen
													} else if (h.loopPtr > 0) {
														a.pointer = h.type ? j.synth
																: h.pointer
																		+ h.loopPtr;
														a.length = h.length
																- h.loopPtr
													}
												}
												if (--j.tick == 0) {
													e = 2;
													while (e > 1) {
														i = this.patterns
																.readByte();
														if (i < 0) {
															switch (i) {
															case -125:
																j.sample = h = this.samples[this.patterns
																		.readUbyte()];
																this.sampFlag = 1;
																j.patternPos = this.patterns.position;
																break;
															case -126:
																this.speed = this.patterns
																		.readUbyte();
																j.patternPos = this.patterns.position;
																break;
															case -127:
																i = h ? h.relative
																		: 428;
																j.portaSpeed = this.patterns
																		.readUbyte()
																		* this.speed;
																j.portaNote = this.patterns
																		.readUbyte();
																j.portaLimit = f[j.portaNote]
																		* i >> 10;
																j.portamento = 0;
																j.portaDelay = this.patterns
																		.readUbyte()
																		* this.speed;
																j.portaFlag = 1;
																j.patternPos = this.patterns.position;
																break;
															case -124:
																a.enabled = 0;
																j.tick = this.speed;
																j.busy = 1;
																j.patternPos = this.patterns.position;
																e = 0;
																break;
															case -128:
																j.trackPos++;
																while (1) {
																	i = this.song.tracks[j.index][j.trackPos];
																	if (i == 65535) {
																		this.mixer.complete = 1
																	} else if (i > 32767) {
																		j.trackPos = (i ^ 32768) >> 1;
																		if (!this.loopSong) {
																			this.complete &= ~j.bitFlag;
																			if (!this.complete)
																				this.mixer.complete = 1
																		}
																	} else {
																		j.patternPos = i;
																		j.tick = 1;
																		e = 1;
																		break
																	}
																}
																break;
															default:
																j.tick = this.speed
																		* -i;
																j.patternPos = this.patterns.position;
																e = 0;
																break
															}
														} else {
															e = 0;
															j.patternPos = this.patterns.position;
															j.note = i;
															j.arpeggioPos = 0;
															j.vibratoFlag = -1;
															j.vibrato = 0;
															j.arpeggioSpeed = h.arpeggioSpeed;
															j.vibratoDelay = h.vibratoDelay;
															j.vibratoSpeed = h.vibratoSpeed;
															j.vibratoDepth = h.vibratoDepth;
															if (h.type == 1) {
																if (this.sampFlag
																		|| h.synchro
																		& 2) {
																	j.pulseCounter = h.pulseCounter;
																	j.pulseDelay = h.pulseDelay;
																	j.pulseDir = 0;
																	j.pulsePos = h.pulsePosL;
																	j.pulseSpeed = h.pulseSpeed;
																	b = j.synth;
																	d = b
																			+ h.pulsePosL;
																	for (; b < d; ++b)
																		this.mixer.memory[b] = h.pulseRateNeg;
																	d += h.length
																			- h.pulsePosL;
																	for (; b < d; ++b)
																		this.mixer.memory[b] = h.pulseRatePos
																}
																a.pointer = j.synth
															} else if (h.type == 2) {
																j.blendCounter = h.blendCounter;
																j.blendDelay = h.blendDelay;
																j.blendDir = 0;
																j.blendPos = 1;
																b = h.pointer;
																c = j.synth;
																d = b + 31;
																for (; b < d; ++b)
																	this.mixer.memory[c++] = this.mixer.memory[b];
																a.pointer = j.synth
															} else {
																a.pointer = h.pointer
															}
															j.tick = this.speed;
															j.busy = 0;
															j.period = f[j.note]
																	* h.relative >> 10;
															j.volume = 0;
															j.envelopePos = 0;
															j.sustainTime = h.sustainTime;
															a.length = h.length;
															a.period = j.period;
															a.volume = 0;
															a.enabled = 1;
															if (j.portaFlag) {
																if (!j.portamento) {
																	j.portamento = j.period;
																	j.portaCounter = 1;
																	j.portaPeriod = j.portaLimit
																			- j.period
																}
															}
														}
													}
												} else if (j.tick == 1) {
													i = this.patterns
															.readAt(j.patternPos) - 160 & 255;
													if (i > 127)
														a.enabled = 0
												}
											} while (e > 0);
											if (!a.enabled) {
												j = j.next;
												continue
											}
											i = j.note
													+ h.arpeggio[j.arpeggioPos];
											if (--j.arpeggioSpeed == 0) {
												j.arpeggioSpeed = h.arpeggioSpeed;
												if (++j.arpeggioPos == h.arpeggioLimit)
													j.arpeggioPos = 0
											}
											j.period = f[i] * h.relative >> 10;
											if (j.portaFlag) {
												if (j.portaDelay) {
													j.portaDelay--
												} else {
													j.period += j.portaCounter
															* j.portaPeriod
															/ j.portaSpeed;
													if (++j.portaCounter > j.portaSpeed) {
														j.note = j.portaNote;
														j.portaFlag = 0
													}
												}
											}
											if (j.vibratoDelay) {
												j.vibratoDelay--
											} else {
												if (j.vibratoFlag) {
													if (j.vibratoFlag < 0) {
														j.vibrato += j.vibratoSpeed;
														if (j.vibrato == j.vibratoDepth)
															j.vibratoFlag ^= 2147483648
													} else {
														j.vibrato -= j.vibratoSpeed;
														if (j.vibrato == 0)
															j.vibratoFlag ^= 2147483648
													}
													if (j.vibrato == 0)
														j.vibratoFlag ^= 1;
													if (j.vibratoFlag & 1) {
														j.period += j.vibrato
													} else {
														j.period -= j.vibrato
													}
												}
											}
											a.period = j.period;
											switch (j.envelopePos) {
											case 4:
												break;
											case 0:
												j.volume += h.attackSpeed;
												if (j.volume >= h.attackVol) {
													j.volume = h.attackVol;
													j.envelopePos = 1
												}
												break;
											case 1:
												j.volume -= h.decaySpeed;
												if (j.volume <= h.decayVol) {
													j.volume = h.decayVol;
													j.envelopePos = 2
												}
												break;
											case 2:
												if (j.sustainTime) {
													j.sustainTime--
												} else {
													j.envelopePos = 3
												}
												break;
											case 3:
												j.volume -= h.releaseSpeed;
												if (j.volume <= h.releaseVol) {
													j.volume = h.releaseVol;
													j.envelopePos = 4
												}
												break
											}
											i = h.envelopeVol << 12;
											i >>= 8;
											i >>= 4;
											i *= j.volume;
											i >>= 8;
											i >>= 1;
											a.volume = i;
											if (h.type == 1) {
												if (j.pulseDelay) {
													j.pulseDelay--
												} else {
													if (j.pulseSpeed) {
														j.pulseSpeed--
													} else {
														if (j.pulseCounter
																|| !(h.synchro & 1)) {
															j.pulseSpeed = h.pulseSpeed;
															if (j.pulseDir & 4) {
																while (1) {
																	if (j.pulsePos >= h.pulsePosL) {
																		e = 1;
																		break
																	}
																	j.pulseDir &= -5;
																	j.pulsePos++;
																	j.pulseCounter--;
																	if (j.pulsePos <= h.pulsePosH) {
																		e = 2;
																		break
																	}
																	j.pulseDir |= 4;
																	j.pulsePos--;
																	j.pulseCounter--
																}
															} else {
																while (1) {
																	if (j.pulsePos <= h.pulsePosH) {
																		e = 2;
																		break
																	}
																	j.pulseDir |= 4;
																	j.pulsePos--;
																	j.pulseCounter--;
																	if (j.pulsePos >= h.pulsePosL) {
																		e = 1;
																		break
																	}
																	j.pulseDir &= -5;
																	j.pulsePos++;
																	j.pulseCounter++
																}
															}
															g = j.synth
																	+ j.pulsePos;
															if (e == 1) {
																this.mixer.memory[g] = h.pulseRatePos;
																j.pulsePos--
															} else {
																this.mixer.memory[g] = h.pulseRateNeg;
																j.pulsePos++
															}
														}
													}
												}
											} else if (h.type == 2) {
												if (j.blendDelay) {
													j.blendDelay--
												} else {
													if (j.blendCounter
															|| !(h.synchro & 4)) {
														if (j.blendDir) {
															if (j.blendPos != 1) {
																j.blendPos--
															} else {
																j.blendDir ^= 1;
																j.blendCounter--
															}
														} else {
															if (j.blendPos != h.blendRate << 1) {
																j.blendPos++
															} else {
																j.blendDir ^= 1;
																j.blendCounter--
															}
														}
														b = h.pointer;
														c = j.synth;
														d = b + 31;
														g = d + 1;
														for (; b < d; ++b) {
															i = j.blendPos
																	* this.mixer.memory[g++] >> h.blendRate;
															this.mixer.memory[g++] = i
																	+ this.mixer.memory[b]
														}
													}
												}
											}
											j = j.next
										}
									}
								}
							});
			g.voices[3] = b(3, 8);
			g.voices[3].next = g.voices[2] = b(2, 4);
			g.voices[2].next = g.voices[1] = b(1, 2);
			g.voices[1].next = g.voices[0] = b(0, 1);
			return Object.seal(g)
		}
		var f = [ 8192, 7728, 7296, 6888, 6504, 6136, 5792, 5464, 5160, 4872,
				4600, 4336, 4096, 3864, 3648, 3444, 3252, 3068, 2896, 2732,
				2580, 2436, 2300, 2168, 2048, 1932, 1824, 1722, 1626, 1534,
				1448, 1366, 1290, 1218, 1150, 1084, 1024, 966, 912, 861, 813,
				767, 724, 683, 645, 609, 575, 542, 512, 483, 456, 430, 406,
				383, 362, 341, 322, 304, 287, 271, 256, 241, 228, 215, 203,
				191, 181, 170, 161, 152, 143, 135 ];
		window.neoart.FEPlayer = e
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				param : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				last : {
					value : 0,
					writable : true
				},
				slideCtr : {
					value : 0,
					writable : true
				},
				slideDir : {
					value : 0,
					writable : true
				},
				slideParam : {
					value : 0,
					writable : true
				},
				slidePeriod : {
					value : 0,
					writable : true
				},
				slideSpeed : {
					value : 0,
					writable : true
				},
				stepPeriod : {
					value : 0,
					writable : true
				},
				stepSpeed : {
					value : 0,
					writable : true
				},
				stepWanted : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.enabled = 0;
						this.period = 0;
						this.effect = 0;
						this.param = 0;
						this.volume = 0;
						this.last = 0;
						this.slideCtr = 0;
						this.slideDir = 0;
						this.slideParam = 0;
						this.slidePeriod = 0;
						this.slideSpeed = 0;
						this.stepPeriod = 0;
						this.stepSpeed = 0;
						this.stepWanted = 0
					}
				}
			})
		}
		function b(b) {
			var j = l(b);
			Object
					.defineProperties(
							j,
							{
								id : {
									value : "FXPlayer"
								},
								standard : {
									value : 0,
									writable : true
								},
								track : {
									value : null,
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								jumpFlag : {
									value : 0,
									writable : true
								},
								delphine : {
									value : 0,
									writable : true
								},
								force : {
									set : function(a) {
										if (a < c)
											a = c;
										else if (a > f)
											a = f;
										this.version = a
									}
								},
								ntsc : {
									set : function(a) {
										this.standard = a;
										this.frequency(a);
										a = a ? 20.44952532 : 20.637767904;
										a = a * (this.sampleRate / 1e3) / 120;
										this.mixer.samplesTick = this.tempo
												/ 122 * a >> 0
									}
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.ntsc = this.standard;
										this.speed = 6;
										this.trackPos = 0;
										this.patternPos = 0;
										this.jumpFlag = 0;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.sample = this.samples[0];
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var b = 0, g, j, k, l, m, n, o, p = 0, q;
										if (a.length < 1686)
											return;
										a.position = 60;
										j = a.readString(4);
										if (j != "SONG") {
											a.position = 124;
											j = a.readString(4);
											if (j != "SO31")
												return;
											if (a.length < 2350)
												return;
											m = 544;
											this.samples.length = l = 32;
											this.version = f
										} else {
											m = 0;
											this.samples.length = l = 16;
											this.version = c
										}
										this.tempo = a.readUshort();
										a.position = 0;
										for (g = 1; g < l; ++g) {
											q = a.readUint();
											if (q) {
												o = i();
												o.pointer = p;
												p += q;
												this.samples[g] = o
											} else {
												this.samples[g] = null
											}
										}
										a.position += 20;
										for (g = 1; g < l; ++g) {
											o = this.samples[g];
											if (!o) {
												a.position += 30;
												continue
											}
											o.name = a.readString(22);
											o.length = a.readUshort() << 1;
											o.volume = a.readUshort();
											o.loop = a.readUshort();
											o.repeat = a.readUshort() << 1
										}
										a.position = 530 + m;
										this.length = l = a.readUbyte();
										a.position++;
										for (g = 0; g < l; ++g) {
											q = a.readUbyte() << 8;
											this.track[g] = q;
											if (q > b)
												b = q
										}
										if (m)
											m += 4;
										a.position = 660 + m;
										b += 256;
										this.patterns.length = b;
										l = this.samples.length;
										for (g = 0; g < b; ++g) {
											n = h();
											n.note = a.readShort();
											q = a.readUbyte();
											n.param = a.readUbyte();
											n.effect = q & 15;
											n.sample = q >> 4;
											this.patterns[g] = n;
											if (this.version == f) {
												if (n.note & 4096) {
													n.sample += 16;
													if (n.note > 0)
														n.note &= 61439
												}
											} else {
												if (n.effect == 9
														|| n.note > 856)
													this.version = d;
												if (n.note < -3)
													this.version = e
											}
											if (n.sample >= l
													|| this.samples[n.sample] == null)
												n.sample = 0
										}
										this.mixer.store(a, p);
										for (g = 1; g < l; ++g) {
											o = this.samples[g];
											if (!o)
												continue;
											if (o.loop) {
												o.loopPtr = o.pointer + o.loop
											} else {
												o.loopPtr = this.mixer.memory.length;
												o.repeat = 2
											}
											p = o.pointer + 4;
											for (k = o.pointer; k < p; ++k)
												this.mixer.memory[k] = 0
										}
										o = i();
										o.pointer = o.loopPtr = this.mixer.memory.length;
										o.length = o.repeat = 2;
										this.samples[0] = o;
										a.position = b = this.delphine = 0;
										for (g = 0; g < 265; ++g)
											b += a.readUshort();
										switch (b) {
										case 172662:
										case 1391423:
										case 1458300:
										case 1706977:
										case 1920077:
										case 1920694:
										case 1677853:
										case 1931956:
										case 1926836:
										case 1385071:
										case 1720635:
										case 1714491:
										case 1731874:
										case 1437490:
											this.delphine = 1;
											break
										}
									}
								},
								process : {
									value : function() {
										var a, b, c, e, f, h, i = this.voices[0];
										if (!this.tick) {
											h = this.track[this.trackPos]
													+ this.patternPos;
											while (i) {
												a = i.channel;
												i.enabled = 0;
												e = this.patterns[h + i.index];
												i.period = e.note;
												i.effect = e.effect;
												i.param = e.param;
												if (e.note == -3) {
													i.effect = 0;
													i = i.next;
													continue
												}
												if (e.sample) {
													f = i.sample = this.samples[e.sample];
													i.volume = f.volume;
													if (i.effect == 5)
														i.volume += i.param;
													else if (i.effect == 6)
														i.volume -= i.param;
													a.volume = i.volume
												} else {
													f = i.sample
												}
												if (i.period) {
													i.last = i.period;
													i.slideSpeed = 0;
													i.stepSpeed = 0;
													i.enabled = 1;
													a.enabled = 0;
													switch (i.period) {
													case -2:
														a.volume = 0;
														break;
													case -4:
														this.jumpFlag = 1;
														break;
													case -5:
														break;
													default:
														a.pointer = f.pointer;
														a.length = f.length;
														if (this.delphine)
															a.period = i.period << 1;
														else
															a.period = i.period;
														break
													}
													if (i.enabled)
														a.enabled = 1;
													a.pointer = f.loopPtr;
													a.length = f.repeat
												}
												i = i.next
											}
										} else {
											while (i) {
												a = i.channel;
												if (this.version == d
														&& i.period == -3) {
													i = i.next;
													continue
												}
												if (i.stepSpeed) {
													i.stepPeriod += i.stepSpeed;
													if (i.stepSpeed < 0) {
														if (i.stepPeriod < i.stepWanted) {
															i.stepPeriod = i.stepWanted;
															if (this.version > d)
																i.stepSpeed = 0
														}
													} else {
														if (i.stepPeriod > i.stepWanted) {
															i.stepPeriod = i.stepWanted;
															if (this.version > d)
																i.stepSpeed = 0
														}
													}
													if (this.version > d)
														i.last = i.stepPeriod;
													a.period = i.stepPeriod
												} else {
													if (i.slideSpeed) {
														h = i.slideParam & 15;
														if (h) {
															if (++i.slideCtr == h) {
																i.slideCtr = 0;
																h = i.slideParam << 4 << 3;
																if (!i.slideDir) {
																	i.slidePeriod += 8;
																	a.period = i.slidePeriod;
																	h += i.slideSpeed;
																	if (h == i.slidePeriod)
																		i.slideDir = 1
																} else {
																	i.slidePeriod -= 8;
																	a.period = i.slidePeriod;
																	h -= i.slideSpeed;
																	if (h == i.slidePeriod)
																		i.slideDir = 0
																}
															} else {
																i = i.next;
																continue
															}
														}
													}
													h = 0;
													switch (i.effect) {
													case 0:
														break;
													case 1:
														h = this.tick % 3;
														b = 0;
														if (h == 2) {
															a.period = i.last;
															i = i.next;
															continue
														}
														if (h == 1)
															h = i.param & 15;
														else
															h = i.param >> 4;
														while (i.last != g[b])
															b++;
														a.period = g[b + h];
														break;
													case 2:
														h = i.param >> 4;
														if (h)
															i.period += h;
														else
															i.period -= i.param & 15;
														a.period = i.period;
														break;
													case 3:
														this.mixer.filter.active = 1;
														break;
													case 4:
														this.mixer.filter.active = 0;
														break;
													case 8:
														h = -1;
													case 7:
														i.stepSpeed = i.param & 15;
														i.stepPeriod = this.version > d ? i.last
																: i.period;
														if (h < 0)
															i.stepSpeed = -i.stepSpeed;
														b = 0;
														while (true) {
															c = g[b];
															if (c == i.stepPeriod)
																break;
															if (c < 0) {
																b = -1;
																break
															} else
																b++
														}
														if (b > -1) {
															c = i.param >> 4;
															if (h > -1)
																c = -c;
															b += c;
															if (b < 0)
																b = 0;
															i.stepWanted = g[b]
														} else
															i.stepWanted = i.period;
														break;
													case 9:
														i.slideSpeed = i.slidePeriod = i.period;
														i.slideParam = i.param;
														i.slideDir = 0;
														i.slideCtr = 0;
														break
													}
												}
												i = i.next
											}
										}
										if (++this.tick == this.speed) {
											this.tick = 0;
											this.patternPos += 4;
											if (this.patternPos == 256
													|| this.jumpFlag) {
												this.patternPos = this.jumpFlag = 0;
												if (++this.trackPos == this.length) {
													this.trackPos = 0;
													this.mixer.complete = 1
												}
											}
										}
									}
								}
							});
			j.voices[0] = a(0);
			j.voices[0].next = j.voices[1] = a(1);
			j.voices[1].next = j.voices[2] = a(2);
			j.voices[2].next = j.voices[3] = a(3);
			j.track = new Uint16Array(128);
			return Object.seal(j)
		}
		var c = 1, d = 2, e = 3, f = 4, g = [ 1076, 1016, 960, 906, 856, 808,
				762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404,
				381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214, 202,
				190, 180, 170, 160, 151, 143, 135, 127, 120, 113, 113, 113,
				113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
				113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, -1 ];
		window.neoart.FXPlayer = b
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				param : {
					value : 0,
					writable : true
				},
				volume1 : {
					value : 0,
					writable : true
				},
				volume2 : {
					value : 0,
					writable : true
				},
				handler : {
					value : 0,
					writable : true
				},
				portaDir : {
					value : 0,
					writable : true
				},
				portaPeriod : {
					value : 0,
					writable : true
				},
				portaSpeed : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				wavePos : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.enabled = 0;
						this.period = 0;
						this.effect = 0;
						this.param = 0;
						this.volume1 = 0;
						this.volume2 = 0;
						this.handler = 0;
						this.portaDir = 0;
						this.portaPeriod = 0;
						this.portaSpeed = 0;
						this.vibratoPos = 0;
						this.vibratoSpeed = 0;
						this.wavePos = 0
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				finetune : {
					value : 0,
					writable : true
				},
				restart : {
					value : 0,
					writable : true
				},
				waveLen : {
					value : 0,
					writable : true
				},
				waves : {
					value : null,
					writable : true
				},
				volumes : {
					value : null,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c(c) {
			var g = l(c);
			Object.defineProperties(g, {
				id : {
					value : "HMPlayer"
				},
				track : {
					value : null,
					writable : true
				},
				patterns : {
					value : [],
					writable : true
				},
				samples : {
					value : [],
					writable : true
				},
				length : {
					value : 0,
					writable : true
				},
				restart : {
					value : 0,
					writable : true
				},
				voices : {
					value : [],
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				jumpFlag : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						var a = this.voices[0];
						this.reset();
						this.speed = 6;
						this.trackPos = 0;
						this.patternPos = 0;
						this.jumpFlag = 0;
						this.mixer.samplesTick = 884;
						while (a) {
							a.initialize();
							a.channel = this.mixer.channels[a.index];
							a.sample = this.samples[0];
							a = a.next
						}
					}
				},
				loader : {
					value : function(a) {
						var c = 0, d = 0, e, f, g, i = 0, j, k, l, m = 0, n;
						if (a.length < 2106)
							return;
						a.position = 1080;
						f = a.readString(4);
						if (f != "FEST")
							return;
						a.position = 950;
						this.length = a.readUbyte();
						this.restart = a.readUbyte();
						for (e = 0; e < 128; ++e)
							this.track[e] = a.readUbyte();
						a.position = 0;
						this.title = a.readString(20);
						this.version = 1;
						for (e = 1; e < 32; ++e) {
							this.samples[e] = null;
							f = a.readString(4);
							if (f == "Mupp") {
								n = a.readUbyte();
								c = n - d++;
								for (g = 0; g < 128; ++g)
									if (this.track[g] && this.track[g] >= c)
										this.track[g]--;
								l = b();
								l.name = f;
								l.length = l.repeat = 32;
								l.restart = a.readUbyte();
								l.waveLen = a.readUbyte();
								a.position += 17;
								l.finetune = a.readByte();
								l.volume = a.readUbyte();
								j = a.position + 4;
								n = 1084 + (n << 10);
								a.position = n;
								l.pointer = this.mixer.memory.length;
								l.waves = new Uint16Array(64);
								l.volumes = new Uint8Array(64);
								this.mixer.store(a, 896);
								for (g = 0; g < 64; ++g)
									l.waves[g] = a.readUbyte() << 5;
								for (g = 0; g < 64; ++g)
									l.volumes[g] = a.readUbyte() & 127;
								a.position = n;
								a.writeInt(1718382436);
								a.position = j;
								i += 896
							} else {
								f = f.substr(0, 2);
								if (f == "El")
									a.position += 18;
								else {
									a.position -= 4;
									f = a.readString(22)
								}
								n = a.readUshort();
								if (!n) {
									a.position += 6;
									continue
								}
								l = b();
								l.name = f;
								l.pointer = m;
								l.length = n << 1;
								l.finetune = a.readByte();
								l.volume = a.readUbyte();
								l.loop = a.readUshort() << 1;
								l.repeat = a.readUshort() << 1;
								m += l.length
							}
							this.samples[e] = l
						}
						for (e = 0; e < 128; ++e) {
							n = this.track[e] << 8;
							this.track[e] = n;
							if (n > d)
								d = n
						}
						a.position = 1084;
						d += 256;
						this.patterns.length = d;
						for (e = 0; e < d; ++e) {
							n = a.readUint();
							while (n == 1718382436) {
								a.position += 1020;
								n = a.readUint()
							}
							k = h();
							k.note = n >> 16 & 4095;
							k.sample = n >> 24 & 240 | n >> 12 & 15;
							k.effect = n >> 8 & 15;
							k.param = n & 255;
							if (k.sample > 31 || !this.samples[k.sample])
								k.sample = 0;
							this.patterns[e] = k
						}
						this.mixer.store(a, m);
						for (e = 1; e < 32; ++e) {
							l = this.samples[e];
							if (l == null || l.name == "Mupp")
								continue;
							l.pointer += i;
							if (l.loop) {
								l.loopPtr = l.pointer + l.loop;
								l.length = l.loop + l.repeat
							} else {
								l.loopPtr = this.mixer.memory.length;
								l.repeat = 2
							}
							m = l.pointer + 4;
							for (g = l.pointer; g < m; ++g)
								this.mixer.memory[g] = 0
						}
						l = b();
						l.pointer = l.loopPtr = this.mixer.memory.length;
						l.length = l.repeat = 2;
						this.samples[0] = l
					}
				},
				process : {
					value : function() {
						var a, b, c, d, e, f = this.voices[0];
						if (!this.tick) {
							b = this.track[this.trackPos] + this.patternPos;
							while (f) {
								a = f.channel;
								f.enabled = 0;
								c = this.patterns[b + f.index];
								f.effect = c.effect;
								f.param = c.param;
								if (c.sample) {
									d = f.sample = this.samples[c.sample];
									f.volume2 = d.volume;
									if (d.name == "Mupp") {
										d.loopPtr = d.pointer + d.waves[0];
										f.handler = 1;
										f.volume1 = d.volumes[0]
									} else {
										f.handler = 0;
										f.volume1 = 64
									}
								} else {
									d = f.sample
								}
								if (c.note) {
									if (f.effect == 3 || f.effect == 5) {
										if (c.note < f.period) {
											f.portaDir = 1;
											f.portaPeriod = c.note
										} else if (c.note > f.period) {
											f.portaDir = 0;
											f.portaPeriod = c.note
										} else {
											f.portaPeriod = 0
										}
									} else {
										f.period = c.note;
										f.vibratoPos = 0;
										f.wavePos = 0;
										f.enabled = 1;
										a.enabled = 0;
										e = f.period * d.finetune >> 8;
										a.period = f.period + e;
										if (f.handler) {
											a.pointer = d.loopPtr;
											a.length = d.repeat
										} else {
											a.pointer = d.pointer;
											a.length = d.length
										}
									}
								}
								switch (f.effect) {
								case 11:
									this.trackPos = f.param - 1;
									this.jumpFlag = 1;
									break;
								case 12:
									f.volume2 = f.param;
									if (f.volume2 > 64)
										f.volume2 = 64;
									break;
								case 13:
									this.jumpFlag = 1;
									break;
								case 14:
									this.mixer.filter.active = f.param ^ 1;
									break;
								case 15:
									e = f.param;
									if (e < 1)
										e = 1;
									else if (e > 31)
										e = 31;
									this.speed = e;
									this.tick = 0;
									break
								}
								if (!c.note)
									this.effects(f);
								this.handler(f);
								if (f.enabled)
									a.enabled = 1;
								a.pointer = d.loopPtr;
								a.length = d.repeat;
								f = f.next
							}
						} else {
							while (f) {
								this.effects(f);
								this.handler(f);
								d = f.sample;
								f.channel.pointer = d.loopPtr;
								f.channel.length = d.repeat;
								f = f.next
							}
						}
						if (++this.tick == this.speed) {
							this.tick = 0;
							this.patternPos += 4;
							if (this.patternPos == 256 || this.jumpFlag) {
								this.patternPos = this.jumpFlag = 0;
								this.trackPos = ++this.trackPos & 127;
								if (this.trackPos == this.length) {
									this.trackPos = this.restart;
									this.mixer.complete = 1
								}
							}
						}
					}
				},
				effects : {
					value : function(a) {
						var b = a.channel, c, g, h = a.period & 4095, i, j;
						if (a.effect || a.param) {
							switch (a.effect) {
							case 0:
								j = this.tick % 3;
								if (!j)
									break;
								if (j == 1)
									j = a.param >> 4;
								else
									j = a.param & 15;
								g = 37 - j;
								for (c = 0; c < g; ++c) {
									if (h >= e[c]) {
										h = e[c + j];
										break
									}
								}
								break;
							case 1:
								a.period -= a.param;
								if (a.period < 113)
									a.period = 113;
								h = a.period;
								break;
							case 2:
								a.period += a.param;
								if (a.period > 856)
									a.period = 856;
								h = a.period;
								break;
							case 3:
							case 5:
								if (a.effect == 5)
									i = 1;
								else if (a.param) {
									a.portaSpeed = a.param;
									a.param = 0
								}
								if (a.portaPeriod) {
									if (a.portaDir) {
										a.period -= a.portaSpeed;
										if (a.period < a.portaPeriod) {
											a.period = a.portaPeriod;
											a.portaPeriod = 0
										}
									} else {
										a.period += a.portaSpeed;
										if (a.period > a.portaPeriod) {
											a.period = a.portaPeriod;
											a.portaPeriod = 0
										}
									}
								}
								h = a.period;
								break;
							case 4:
							case 6:
								if (a.effect == 6)
									i = 1;
								else if (a.param)
									a.vibratoSpeed = a.param;
								j = f[a.vibratoPos >> 2 & 31];
								j = (a.vibratoSpeed & 15) * j >> 7;
								if (a.vibratoPos > 127)
									h -= j;
								else
									h += j;
								j = a.vibratoSpeed >> 2 & 60;
								a.vibratoPos = a.vibratoPos + j & 255;
								break;
							case 7:
								j = d[(a.vibratoPos & 15)
										+ ((a.param & 15) << 4)];
								a.vibratoPos++;
								for (c = 0; c < 37; ++c)
									if (h >= e[c])
										break;
								j += c;
								if (j > 35)
									j -= 12;
								h = e[j];
								break;
							case 10:
								i = 1;
								break
							}
						}
						b.period = h + (h * a.sample.finetune >> 8);
						if (i) {
							j = a.param >> 4;
							if (j)
								a.volume2 += j;
							else
								a.volume2 -= a.param & 15;
							if (a.volume2 > 64)
								a.volume2 = 64;
							else if (a.volume2 < 0)
								a.volume2 = 0
						}
					}
				},
				handler : {
					value : function(a) {
						var b;
						if (a.handler) {
							b = a.sample;
							b.loopPtr = b.pointer + b.waves[a.wavePos];
							a.volume1 = b.volumes[a.wavePos];
							if (++a.wavePos > b.waveLen) {
								a.wavePos = b.restart
							}
						}
						a.channel.volume = a.volume1 * a.volume2 >> 6
					}
				}
			});
			g.voices[0] = a(0);
			g.voices[0].next = g.voices[1] = a(1);
			g.voices[1].next = g.voices[2] = a(2);
			g.voices[2].next = g.voices[3] = a(3);
			g.track = new Uint16Array(128);
			return Object.seal(g)
		}
		var d = [ 0, 3, 7, 12, 15, 12, 7, 3, 0, 3, 7, 12, 15, 12, 7, 3, 0, 4,
				7, 12, 16, 12, 7, 4, 0, 4, 7, 12, 16, 12, 7, 4, 0, 3, 8, 12,
				15, 12, 8, 3, 0, 3, 8, 12, 15, 12, 8, 3, 0, 4, 8, 12, 16, 12,
				8, 4, 0, 4, 8, 12, 16, 12, 8, 4, 0, 5, 8, 12, 17, 12, 8, 5, 0,
				5, 8, 12, 17, 12, 8, 5, 0, 5, 9, 12, 17, 12, 9, 5, 0, 5, 9, 12,
				17, 12, 9, 5, 12, 0, 7, 0, 3, 0, 7, 0, 12, 0, 7, 0, 3, 0, 7, 0,
				12, 0, 7, 0, 4, 0, 7, 0, 12, 0, 7, 0, 4, 0, 7, 0, 0, 3, 7, 3,
				7, 12, 7, 12, 15, 12, 7, 12, 7, 3, 7, 3, 0, 4, 7, 4, 7, 12, 7,
				12, 16, 12, 7, 12, 7, 4, 7, 4, 31, 27, 24, 19, 15, 12, 7, 3, 0,
				3, 7, 12, 15, 19, 24, 27, 31, 28, 24, 19, 16, 12, 7, 4, 0, 4,
				7, 12, 16, 19, 24, 28, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0,
				12, 0, 12, 0, 12, 0, 12, 24, 12, 0, 12, 24, 12, 0, 12, 24, 12,
				0, 12, 24, 12, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3,
				0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4 ], e = [ 856,
				808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428,
				404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226, 214,
				202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113, 0 ], f = [
				0, 24, 49, 74, 97, 120, 141, 161, 180, 197, 212, 224, 235, 244,
				250, 253, 255, 253, 250, 244, 235, 224, 212, 197, 180, 161,
				141, 120, 97, 74, 49, 24 ];
		window.neoart.HMPlayer = c
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				cosoCounter : {
					value : 0,
					writable : true
				},
				cosoSpeed : {
					value : 0,
					writable : true
				},
				trackPtr : {
					value : 0,
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				trackTransp : {
					value : 0,
					writable : true
				},
				patternPtr : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				frqseqPtr : {
					value : 0,
					writable : true
				},
				frqseqPos : {
					value : 0,
					writable : true
				},
				volseqPtr : {
					value : 0,
					writable : true
				},
				volseqPos : {
					value : 0,
					writable : true
				},
				sample : {
					value : 0,
					writable : true
				},
				loopPtr : {
					value : 0,
					writable : true
				},
				repeat : {
					value : 0,
					writable : true
				},
				tick : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				transpose : {
					value : 0,
					writable : true
				},
				info : {
					value : 0,
					writable : true
				},
				infoPrev : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				volCounter : {
					value : 0,
					writable : true
				},
				volSpeed : {
					value : 0,
					writable : true
				},
				volSustain : {
					value : 0,
					writable : true
				},
				volTransp : {
					value : 0,
					writable : true
				},
				volFade : {
					value : 0,
					writable : true
				},
				portaDelta : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				vibDelay : {
					value : 0,
					writable : true
				},
				vibDelta : {
					value : 0,
					writable : true
				},
				vibDepth : {
					value : 0,
					writable : true
				},
				vibSpeed : {
					value : 0,
					writable : true
				},
				slide : {
					value : 0,
					writable : true
				},
				sldActive : {
					value : 0,
					writable : true
				},
				sldDone : {
					value : 0,
					writable : true
				},
				sldCounter : {
					value : 0,
					writable : true
				},
				sldSpeed : {
					value : 0,
					writable : true
				},
				sldDelta : {
					value : 0,
					writable : true
				},
				sldPointer : {
					value : 0,
					writable : true
				},
				sldLen : {
					value : 0,
					writable : true
				},
				sldEnd : {
					value : 0,
					writable : true
				},
				sldLoopPtr : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.enabled = 0;
						this.cosoCounter = 0;
						this.cosoSpeed = 0;
						this.trackPtr = 0;
						this.trackPos = 12;
						this.trackTransp = 0;
						this.patternPtr = 0;
						this.patternPos = 0;
						this.frqseqPtr = 0;
						this.frqseqPos = 0;
						this.volseqPtr = 0;
						this.volseqPos = 0;
						this.sample = -1;
						this.loopPtr = 0;
						this.repeat = 0;
						this.tick = 0;
						this.note = 0;
						this.transpose = 0;
						this.info = 0;
						this.infoPrev = 0;
						this.volume = 0;
						this.volCounter = 1;
						this.volSpeed = 1;
						this.volSustain = 0;
						this.volTransp = 0;
						this.volFade = 100;
						this.portaDelta = 0;
						this.vibrato = 0;
						this.vibDelay = 0;
						this.vibDelta = 0;
						this.vibDepth = 0;
						this.vibSpeed = 0;
						this.slide = 0;
						this.sldActive = 0;
						this.sldDone = 0;
						this.sldCounter = 0;
						this.sldSpeed = 0;
						this.sldDelta = 0;
						this.sldPointer = 0;
						this.sldLen = 0;
						this.sldEnd = 0;
						this.sldLoopPtr = 0
					}
				}
			})
		}
		function b() {
			return Object.create(null, {
				pointer : {
					value : 0,
					writable : true
				},
				speed : {
					value : 0,
					writable : true
				},
				length : {
					value : 0,
					writable : true
				}
			})
		}
		function c(c) {
			var e = l(c);
			Object
					.defineProperties(
							e,
							{
								id : {
									value : "JHPlayer"
								},
								songs : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								stream : {
									value : null,
									writable : true
								},
								base : {
									value : 0,
									writable : true
								},
								patterns : {
									value : 0,
									writable : true
								},
								patternLen : {
									value : 0,
									writable : true
								},
								periods : {
									value : 0,
									writable : true
								},
								frqseqs : {
									value : 0,
									writable : true
								},
								volseqs : {
									value : 0,
									writable : true
								},
								samplesData : {
									value : 0,
									writable : true
								},
								song : {
									value : null,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								coso : {
									value : 0,
									writable : true
								},
								variant : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.song = this.songs[this.playSong];
										this.speed = this.song.speed;
										this.tick = this.coso
												|| this.variant > 1 ? 1
												: this.speed;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.trackPtr = this.song.pointer
													+ a.index * 3;
											if (this.coso) {
												a.trackPos = 0;
												a.patternPos = 8
											} else {
												this.stream.position = a.trackPtr;
												a.patternPtr = this.patterns
														+ this.stream
																.readUbyte()
														* this.patternLen;
												a.trackTransp = this.stream
														.readByte();
												a.volTransp = this.stream
														.readByte();
												a.frqseqPtr = this.base;
												a.volseqPtr = this.base
											}
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var c, d, e, f, g, h, j, k, l, m = 0;
										this.base = this.periods = 0;
										this.coso = a.readString(4) == "COSO";
										if (this.coso) {
											for (d = 0; d < 7; ++d)
												m += a.readInt();
											if (m == 16942) {
												a.position = 47;
												m += a.readUbyte()
											}
											switch (m) {
											case 22666:
											case 18842:
											case 30012:
											case 22466:
											case 3546:
												this.variant = 1;
												break;
											case 16948:
											case 18332:
											case 13698:
												this.variant = 2;
												break;
											case 18546:
											case 13926:
											case 8760:
											case 17242:
											case 11394:
											case 14494:
											case 14392:
											case 13576:
											case 6520:
												this.variant = 3;
												break;
											default:
												this.variant = 4
											}
											this.version = 2;
											a.position = 4;
											this.frqseqs = a.readUint();
											this.volseqs = a.readUint();
											this.patterns = a.readUint();
											l = a.readUint();
											k = a.readUint();
											c = a.readUint();
											this.samplesData = a.readUint();
											a.position = 0;
											a.writeInt(16777216);
											a.writeInt(225);
											a.writeShort(65535);
											f = (this.samplesData - c) / 10 - 1;
											this.lastSong = (c - k) / 6
										} else {
											while (a.bytesAvailable > 12) {
												m = a.readUshort();
												switch (m) {
												case 576:
													m = a.readUshort();
													if (m == 127) {
														a.position += 2;
														this.periods = a.position
																+ a
																		.readUshort()
													}
													break;
												case 28674:
												case 28675:
													this.channels = m & 255;
													m = a.readUshort();
													if (m == 30208)
														m = a.readUshort();
													if (m == 16890) {
														a.position += 4;
														this.base = a.position
																+ a
																		.readUshort()
													}
													break;
												case 21574:
													m = a.readUshort();
													if (m == 19800) {
														e = a.position - 4;
														a.position = a.length
													}
													break
												}
											}
											if (!e || !this.base
													|| !this.periods)
												return;
											this.version = 1;
											a.position = e + 4;
											this.frqseqs = g = e + 32;
											m = a.readUshort();
											this.volseqs = g += ++m << 6;
											m = a.readUshort();
											this.patterns = g += ++m << 6;
											m = a.readUshort();
											a.position += 2;
											this.patternLen = a.readUshort();
											l = g += ++m * this.patternLen;
											a.position -= 4;
											m = a.readUshort();
											k = g += ++m * 12;
											a.position = e + 16;
											this.lastSong = a.readUshort();
											c = g += ++this.lastSong * 6;
											f = a.readUshort();
											this.samplesData = g + f * 30
										}
										a.position = c;
										this.samples = [];
										m = 0;
										for (d = 0; d < f; ++d) {
											h = i();
											if (!this.coso)
												h.name = a.readString(18);
											h.pointer = a.readUint();
											h.length = a.readUshort() << 1;
											if (!this.coso)
												h.volume = a.readUshort();
											h.loopPtr = a.readUshort()
													+ h.pointer;
											h.repeat = a.readUshort() << 1;
											if (h.loopPtr & 1)
												h.loopPtr--;
											m += h.length;
											this.samples[d] = h
										}
										a.position = this.samplesData;
										this.mixer.store(a, m);
										a.position = k;
										this.songs = [];
										m = 0;
										for (d = 0; d < this.lastSong; ++d) {
											j = b();
											j.pointer = a.readUshort();
											j.length = a.readUshort()
													- j.pointer + 1;
											j.speed = a.readUshort();
											j.pointer = j.pointer * 12 + l;
											j.length *= 12;
											if (j.length > 12)
												this.songs[m++] = j
										}
										this.lastSong = this.songs.length - 1;
										if (!this.coso) {
											a.position = 0;
											this.variant = 1;
											while (a.position < e) {
												m = a.readUshort();
												if (m == 45116 || m == 3072) {
													m = a.readUshort();
													if (m == 229 || m == 230
															|| m == 233) {
														this.variant = 2;
														break
													}
												} else if (m == 20219) {
													this.variant = 3;
													break
												}
											}
										}
										this.stream = a
									}
								},
								process : {
									value : function() {
										var a, b, c, e, f, g, h, i = this.voices[0];
										if (--this.tick == 0) {
											this.tick = this.speed;
											while (i) {
												a = i.channel;
												if (this.coso) {
													if (--i.cosoCounter < 0) {
														i.cosoCounter = i.cosoSpeed;
														do {
															this.stream.position = i.patternPos;
															do {
																b = 0;
																h = this.stream
																		.readByte();
																if (h == -1) {
																	if (i.trackPos == this.song.length) {
																		i.trackPos = 0;
																		this.mixer.complete = 1
																	}
																	this.stream.position = i.trackPtr
																			+ i.trackPos;
																	h = this.stream
																			.readUbyte();
																	i.trackTransp = this.stream
																			.readByte();
																	e = this.stream
																			.readAt(this.stream.position);
																	if (this.variant > 3
																			&& e > 127) {
																		f = e >> 4 & 15;
																		e &= 15;
																		if (f == 15) {
																			f = 100;
																			if (e) {
																				f = 15 - e + 1;
																				f <<= 1;
																				e = f;
																				f <<= 1;
																				f += e
																			}
																			i.volFade = f
																		} else if (f == 8) {
																			this.mixer.complete = 1
																		} else if (f == 14) {
																			this.speed = e
																		}
																	} else {
																		i.volTransp = this.stream
																				.readByte()
																	}
																	this.stream.position = this.patterns
																			+ (h << 1);
																	i.patternPos = this.stream
																			.readUshort();
																	i.trackPos += 12;
																	b = 1
																} else if (h == -2) {
																	i.cosoCounter = i.cosoSpeed = this.stream
																			.readUbyte();
																	b = 3
																} else if (h == -3) {
																	i.cosoCounter = i.cosoSpeed = this.stream
																			.readUbyte();
																	i.patternPos = this.stream.position
																} else {
																	i.note = h;
																	i.info = this.stream
																			.readByte();
																	if (i.info & 224)
																		i.infoPrev = this.stream
																				.readByte();
																	i.patternPos = this.stream.position;
																	i.portaDelta = 0;
																	if (h >= 0) {
																		if (this.variant == 1)
																			a.enabled = 0;
																		h = (i.info & 31)
																				+ i.volTransp;
																		this.stream.position = this.volseqs
																				+ (h << 1);
																		this.stream.position = this.stream
																				.readUshort();
																		i.volCounter = i.volSpeed = this.stream
																				.readUbyte();
																		i.volSustain = 0;
																		h = this.stream
																				.readByte();
																		i.vibSpeed = this.stream
																				.readByte();
																		i.vibrato = 64;
																		i.vibDepth = i.vibDelta = this.stream
																				.readByte();
																		i.vibDelay = this.stream
																				.readUbyte();
																		i.volseqPtr = this.stream.position;
																		i.volseqPos = 0;
																		if (h != -128) {
																			if (this.variant > 1
																					&& i.info
																					& 64)
																				h = i.infoPrev;
																			this.stream.position = this.frqseqs
																					+ (h << 1);
																			i.frqseqPtr = this.stream
																					.readUshort();
																			i.frqseqPos = 0;
																			i.tick = 0
																		}
																	}
																}
															} while (b > 2)
														} while (b > 0)
													}
												} else {
													this.stream.position = i.patternPtr
															+ i.patternPos;
													h = this.stream.readByte();
													if (i.patternPos == this.patternLen
															|| (h & 127) == 1) {
														if (i.trackPos == this.song.length) {
															i.trackPos = 0;
															this.mixer.complete = 1
														}
														this.stream.position = i.trackPtr
																+ i.trackPos;
														h = this.stream
																.readUbyte();
														i.trackTransp = this.stream
																.readByte();
														i.volTransp = this.stream
																.readByte();
														if (i.volTransp == -128)
															this.mixer.complete = 1;
														i.patternPtr = this.patterns
																+ h
																* this.patternLen;
														i.patternPos = 0;
														i.trackPos += 12;
														this.stream.position = i.patternPtr;
														h = this.stream
																.readByte()
													}
													if (h & 127) {
														i.note = h & 127;
														i.portaDelta = 0;
														e = this.stream.position;
														if (!i.patternPos)
															this.stream.position += this.patternLen;
														this.stream.position -= 2;
														i.infoPrev = this.stream
																.readByte();
														this.stream.position = e;
														i.info = this.stream
																.readByte();
														if (h >= 0) {
															if (this.variant == 1)
																a.enabled = 0;
															h = (i.info & 31)
																	+ i.volTransp;
															this.stream.position = this.volseqs
																	+ (h << 6);
															i.volCounter = i.volSpeed = this.stream
																	.readUbyte();
															i.volSustain = 0;
															h = this.stream
																	.readByte();
															i.vibSpeed = this.stream
																	.readByte();
															i.vibrato = 64;
															i.vibDepth = i.vibDelta = this.stream
																	.readByte();
															i.vibDelay = this.stream
																	.readUbyte();
															i.volseqPtr = this.stream.position;
															i.volseqPos = 0;
															if (this.variant > 1
																	&& i.info
																	& 64)
																h = i.infoPrev;
															i.frqseqPtr = this.frqseqs
																	+ (h << 6);
															i.frqseqPos = 0;
															i.tick = 0
														}
													}
													i.patternPos += 2
												}
												i = i.next
											}
											i = this.voices[0]
										}
										while (i) {
											a = i.channel;
											i.enabled = 0;
											do {
												b = 0;
												if (i.tick) {
													i.tick--
												} else {
													this.stream.position = i.frqseqPtr
															+ i.frqseqPos;
													do {
														h = this.stream
																.readByte();
														if (h == -31)
															break;
														b = 3;
														if (this.variant == 3
																&& this.coso) {
															if (h == -27) {
																h = -30
															} else if (h == -26) {
																h = -28
															}
														}
														switch (h) {
														case -32:
															i.frqseqPos = this.stream
																	.readUbyte() & 63;
															this.stream.position = i.frqseqPtr
																	+ i.frqseqPos;
															break;
														case -30:
															g = this.samples[this.stream
																	.readUbyte()];
															i.sample = -1;
															i.loopPtr = g.loopPtr;
															i.repeat = g.repeat;
															i.enabled = 1;
															a.enabled = 0;
															a.pointer = g.pointer;
															a.length = g.length;
															i.volseqPos = 0;
															i.volCounter = 1;
															i.slide = 0;
															i.frqseqPos += 2;
															break;
														case -29:
															i.vibSpeed = this.stream
																	.readByte();
															i.vibDepth = this.stream
																	.readByte();
															i.frqseqPos += 3;
															break;
														case -28:
															g = this.samples[this.stream
																	.readUbyte()];
															i.loopPtr = g.loopPtr;
															i.repeat = g.repeat;
															a.pointer = g.pointer;
															a.length = g.length;
															i.slide = 0;
															i.frqseqPos += 2;
															break;
														case -27:
															if (this.variant < 2)
																break;
															g = this.samples[this.stream
																	.readUbyte()];
															a.enabled = 0;
															i.enabled = 1;
															if (this.variant == 2) {
																e = this.stream
																		.readUbyte()
																		* g.length;
																i.loopPtr = g.loopPtr
																		+ e;
																i.repeat = g.repeat;
																a.pointer = g.pointer
																		+ e;
																a.length = g.length;
																i.frqseqPos += 3
															} else {
																i.sldPointer = g.pointer;
																i.sldEnd = g.pointer
																		+ g.length;
																h = this.stream
																		.readUshort();
																if (h == 65535) {
																	i.sldLoopPtr = g.length
																} else {
																	i.sldLoopPtr = h << 1
																}
																i.sldLen = this.stream
																		.readUshort() << 1;
																i.sldDelta = this.stream
																		.readShort() << 1;
																i.sldActive = 0;
																i.sldCounter = 0;
																i.sldSpeed = this.stream
																		.readUbyte();
																i.slide = 1;
																i.sldDone = 0;
																i.frqseqPos += 9
															}
															i.volseqPos = 0;
															i.volCounter = 1;
															break;
														case -26:
															if (this.variant < 3)
																break;
															i.sldLen = this.stream
																	.readUshort() << 1;
															i.sldDelta = this.stream
																	.readShort() << 1;
															i.sldActive = 0;
															i.sldCounter = 0;
															i.sldSpeed = this.stream
																	.readUbyte();
															i.sldDone = 0;
															i.frqseqPos += 6;
															break;
														case -25:
															if (this.variant == 1) {
																i.frqseqPtr = this.frqseqs
																		+ (this.stream
																				.readUbyte() << 6);
																i.frqseqPos = 0;
																this.stream.position = i.frqseqPtr;
																b = 3
															} else {
																h = this.stream
																		.readUbyte();
																if (h != i.sample) {
																	g = this.samples[h];
																	i.sample = h;
																	i.loopPtr = g.loopPtr;
																	i.repeat = g.repeat;
																	i.enabled = 1;
																	a.enabled = 0;
																	a.pointer = g.pointer;
																	a.length = g.length
																}
																i.volseqPos = 0;
																i.volCounter = 1;
																i.slide = 0;
																i.frqseqPos += 2
															}
															break;
														case -24:
															i.tick = this.stream
																	.readUbyte();
															i.frqseqPos += 2;
															b = 1;
															break;
														case -23:
															if (this.variant < 2)
																break;
															g = this.samples[this.stream
																	.readUbyte()];
															i.sample = -1;
															i.enabled = 1;
															f = this.stream
																	.readUbyte();
															e = this.stream.position;
															a.enabled = 0;
															this.stream.position = this.samplesData
																	+ g.pointer
																	+ 4;
															h = this.stream
																	.readUshort()
																	* 24
																	+ (this.stream
																			.readUshort() << 2);
															this.stream.position += f * 24;
															i.loopPtr = this.stream
																	.readUint() & 4294967294;
															a.length = (this.stream
																	.readUint() & 4294967294)
																	- i.loopPtr;
															i.loopPtr += g.pointer
																	+ h + 8;
															a.pointer = i.loopPtr;
															i.repeat = 2;
															this.stream.position = e;
															e = i.loopPtr + 1;
															this.mixer.memory[e] = this.mixer.memory[i.loopPtr];
															i.volseqPos = 0;
															i.volCounter = 1;
															i.slide = 0;
															i.frqseqPos += 3;
															break;
														default:
															i.transpose = h;
															i.frqseqPos++;
															b = 0
														}
													} while (b > 2)
												}
											} while (b > 0);
											if (i.slide) {
												if (!i.sldDone) {
													if (--i.sldCounter < 0) {
														i.sldCounter = i.sldSpeed;
														if (i.sldActive) {
															h = i.sldLoopPtr
																	+ i.sldDelta;
															if (h < 0) {
																i.sldDone = 1;
																h = i.sldLoopPtr
																		- i.sldDelta
															} else {
																e = i.sldPointer
																		+ i.sldLen
																		+ h;
																if (e > i.sldEnd) {
																	i.sldDone = 1;
																	h = i.sldLoopPtr
																			- i.sldDelta
																}
															}
															i.sldLoopPtr = h
														} else {
															i.sldActive = 1
														}
														i.loopPtr = i.sldPointer
																+ i.sldLoopPtr;
														i.repeat = i.sldLen;
														a.pointer = i.loopPtr;
														a.length = i.repeat
													}
												}
											}
											do {
												b = 0;
												if (i.volSustain) {
													i.volSustain--
												} else {
													if (--i.volCounter)
														break;
													i.volCounter = i.volSpeed;
													do {
														this.stream.position = i.volseqPtr
																+ i.volseqPos;
														h = this.stream
																.readByte();
														if (h <= -25
																&& h >= -31)
															break;
														switch (h) {
														case -24:
															i.volSustain = this.stream
																	.readUbyte();
															i.volseqPos += 2;
															b = 1;
															break;
														case -32:
															i.volseqPos = (this.stream
																	.readUbyte() & 63) - 5;
															b = 3;
															break;
														default:
															i.volume = h;
															i.volseqPos++;
															b = 0
														}
													} while (b > 2)
												}
											} while (b > 0);
											h = i.transpose;
											if (h >= 0)
												h += i.note + i.trackTransp;
											h &= 127;
											if (this.coso) {
												if (h > 83)
													h = 0;
												c = d[h];
												h <<= 1
											} else {
												h <<= 1;
												this.stream.position = this.periods
														+ h;
												c = this.stream.readUshort()
											}
											if (i.vibDelay) {
												i.vibDelay--
											} else {
												if (this.variant > 3) {
													if (i.vibrato & 32) {
														h = i.vibDelta
																+ i.vibSpeed;
														if (h > i.vibDepth) {
															i.vibrato &= ~32;
															h = i.vibDepth
														}
													} else {
														h = i.vibDelta
																- i.vibSpeed;
														if (h < 0) {
															i.vibrato |= 32;
															h = 0
														}
													}
													i.vibDelta = h;
													h = (h - (i.vibDepth >> 1))
															* c;
													c += h >> 10
												} else if (this.variant > 2) {
													h = i.vibSpeed;
													if (h < 0) {
														h &= 127;
														i.vibrato ^= 1
													}
													if (!(i.vibrato & 1)) {
														if (i.vibrato & 32) {
															i.vibDelta += h;
															e = i.vibDepth << 1;
															if (i.vibDelta > e) {
																i.vibrato &= ~32;
																i.vibDelta = e
															}
														} else {
															i.vibDelta -= h;
															if (i.vibDelta < 0) {
																i.vibrato |= 32;
																i.vibDelta = 0
															}
														}
													}
													c += h - i.vibDepth
												} else {
													if (i.vibrato >= 0
															|| !(i.vibrato & 1)) {
														if (i.vibrato & 32) {
															i.vibDelta += i.vibSpeed;
															e = i.vibDepth << 1;
															if (i.vibDelta >= e) {
																i.vibrato &= ~32;
																i.vibDelta = e
															}
														} else {
															i.vibDelta -= i.vibSpeed;
															if (i.vibDelta < 0) {
																i.vibrato |= 32;
																i.vibDelta = 0
															}
														}
													}
													e = i.vibDelta - i.vibDepth;
													if (e) {
														h += 160;
														while (h < 256) {
															e += e;
															h += 24
														}
														c += e
													}
												}
											}
											if (this.variant < 3)
												i.vibrato ^= 1;
											if (i.info & 32) {
												h = i.infoPrev;
												if (this.variant > 3) {
													if (h < 0) {
														i.portaDelta += -h;
														h = i.portaDelta * c;
														c += h >> 10
													} else {
														i.portaDelta += h;
														h = i.portaDelta * c;
														c -= h >> 10
													}
												} else {
													if (h < 0) {
														i.portaDelta += -h << 11;
														c += i.portaDelta >> 16
													} else {
														i.portaDelta += h << 11;
														c -= i.portaDelta >> 16
													}
												}
											}
											if (this.variant > 3) {
												h = i.volFade * i.volume / 100
											} else {
												h = i.volume
											}
											a.period = c;
											a.volume = h;
											if (i.enabled) {
												a.enabled = 1;
												a.pointer = i.loopPtr;
												a.length = i.repeat
											}
											i = i.next
										}
									}
								}
							});
			e.voices[0] = a(0);
			e.voices[0].next = e.voices[1] = a(1);
			e.voices[1].next = e.voices[2] = a(2);
			e.voices[2].next = e.voices[3] = a(3);
			return Object.seal(e)
		}
		var d = [ 1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016,
				960, 906, 856, 808, 762, 720, 678, 640, 604, 570, 538, 508,
				480, 453, 428, 404, 381, 360, 339, 320, 302, 285, 269, 254,
				240, 226, 214, 202, 190, 180, 170, 160, 151, 143, 135, 127,
				120, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113, 113,
				113, 113, 3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152,
				2032, 1920, 1812, 6848, 6464, 6096, 5760, 5424, 5120, 4832,
				4560, 4304, 4064, 3840, 3624 ];
		window.neoart.JHPlayer = c
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				param : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				portaDir : {
					value : 0,
					writable : true
				},
				portaPeriod : {
					value : 0,
					writable : true
				},
				portaSpeed : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.enabled = 0;
						this.period = 0;
						this.effect = 0;
						this.param = 0;
						this.volume = 0;
						this.portaDir = 0;
						this.portaPeriod = 0;
						this.portaSpeed = 0;
						this.vibratoPos = 0;
						this.vibratoSpeed = 0
					}
				}
			})
		}
		function b(b) {
			var m = l(b);
			Object
					.defineProperties(
							m,
							{
								id : {
									value : "MKPlayer"
								},
								track : {
									value : null,
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								restart : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								jumpFlag : {
									value : 0,
									writable : true
								},
								vibratoDepth : {
									value : 0,
									writable : true
								},
								restartSave : {
									value : 0,
									writable : true
								},
								force : {
									set : function(a) {
										if (a < c)
											a = c;
										else if (a > g)
											a = g;
										this.version = a;
										if (a == g)
											this.vibratoDepth = 6;
										else
											this.vibratoDepth = 7;
										if (a == e) {
											this.restartSave = this.restart;
											this.restart = 0
										} else {
											this.restart = this.restartSave;
											this.restartSave = 0
										}
									}
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.force = this.version;
										this.speed = 6;
										this.trackPos = 0;
										this.patternPos = 0;
										this.jumpFlag = 0;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.sample = this.samples[0];
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var b = 0, j, k, l, m, n, o = 0, p;
										if (a.length < 2106)
											return;
										a.position = 1080;
										k = a.readString(4);
										if (k != "M.K." && k != "FLT4")
											return;
										a.position = 0;
										this.title = a.readString(20);
										this.version = c;
										a.position += 22;
										for (j = 1; j < 32; ++j) {
											p = a.readUshort();
											if (!p) {
												this.samples[j] = null;
												a.position += 28;
												continue
											}
											n = i();
											a.position -= 24;
											n.name = a.readString(22);
											n.length = p << 1;
											a.position += 3;
											n.volume = a.readUbyte();
											n.loop = a.readUshort() << 1;
											n.repeat = a.readUshort() << 1;
											a.position += 22;
											n.pointer = o;
											o += n.length;
											this.samples[j] = n;
											if (n.length > 32768)
												this.version = d
										}
										a.position = 950;
										this.length = a.readUbyte();
										p = a.readUbyte();
										this.restart = p < length ? p : 0;
										for (j = 0; j < 128; ++j) {
											p = a.readUbyte() << 8;
											this.track[j] = p;
											if (p > b)
												b = p
										}
										a.position = 1084;
										b += 256;
										this.patterns.length = b;
										for (j = 0; j < b; ++j) {
											m = h();
											p = a.readUint();
											m.note = p >> 16 & 4095;
											m.effect = p >> 8 & 15;
											m.sample = p >> 24 & 240 | p >> 12
													& 15;
											m.param = p & 255;
											this.patterns[j] = m;
											if (m.sample > 31
													|| !this.samples[m.sample])
												m.sample = 0;
											if (m.effect == 3 || m.effect == 4)
												this.version = e;
											if (m.effect == 5 || m.effect == 6)
												this.version = g;
											if (m.effect > 6 && m.effect < 10) {
												this.version = 0;
												return
											}
										}
										this.mixer.store(a, o);
										for (j = 1; j < 32; ++j) {
											n = this.samples[j];
											if (!n)
												continue;
											if (n.name.indexOf("2.0") > -1)
												this.version = g;
											if (n.loop) {
												n.loopPtr = n.pointer + n.loop;
												n.length = n.loop + n.repeat
											} else {
												n.loopPtr = this.mixer.memory.length;
												n.repeat = 2
											}
											o = n.pointer + 4;
											for (l = n.pointer; l < o; ++l)
												this.mixer.memory[l] = 0
										}
										n = i();
										n.pointer = n.loopPtr = this.mixer.memory.length;
										n.length = n.repeat = 2;
										this.samples[0] = n;
										if (this.version < g
												&& this.restart != 127)
											this.version = f
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, f, h, i, l, m = this.voices[0];
										if (!this.tick) {
											d = this.track[this.trackPos]
													+ this.patternPos;
											while (m) {
												a = m.channel;
												m.enabled = 0;
												f = this.patterns[d + m.index];
												m.effect = f.effect;
												m.param = f.param;
												if (f.sample) {
													h = m.sample = this.samples[f.sample];
													a.volume = m.volume = h.volume
												} else {
													h = m.sample
												}
												if (f.note) {
													if (m.effect == 3
															|| m.effect == 5) {
														if (f.note < m.period) {
															m.portaDir = 1;
															m.portaPeriod = f.note
														} else if (f.note > m.period) {
															m.portaDir = 0;
															m.portaPeriod = f.note
														} else {
															m.portaPeriod = 0
														}
													} else {
														m.enabled = 1;
														m.vibratoPos = 0;
														a.enabled = 0;
														a.pointer = h.pointer;
														a.length = h.length;
														a.period = m.period = f.note
													}
												}
												switch (m.effect) {
												case 11:
													this.trackPos = m.param - 1;
													this.jumpFlag ^= 1;
													break;
												case 12:
													a.volume = m.param;
													if (this.version == g)
														m.volume = m.param;
													break;
												case 13:
													this.jumpFlag ^= 1;
													break;
												case 14:
													this.mixer.filter.active = m.param ^ 1;
													break;
												case 15:
													l = m.param;
													if (l < 1)
														l = 1;
													else if (l > 31)
														l = 31;
													this.speed = l;
													this.tick = 0;
													break
												}
												if (m.enabled)
													a.enabled = 1;
												a.pointer = h.loopPtr;
												a.length = h.repeat;
												m = m.next
											}
										} else {
											while (m) {
												a = m.channel;
												if (!m.effect && !m.param) {
													a.period = m.period;
													m = m.next;
													continue
												}
												switch (m.effect) {
												case 0:
													l = this.tick % 3;
													if (!l) {
														a.period = m.period;
														m = m.next;
														continue
													}
													if (l == 1)
														l = m.param >> 4;
													else
														l = m.param & 15;
													e = m.period & 4095;
													c = 37 - l;
													for (b = 0; b < c; ++b) {
														if (e >= j[b]) {
															a.period = j[b + l];
															break
														}
													}
													break;
												case 1:
													m.period -= m.param;
													if (m.period < 113)
														m.period = 113;
													a.period = m.period;
													break;
												case 2:
													m.period += m.param;
													if (m.period > 856)
														m.period = 856;
													a.period = m.period;
													break;
												case 3:
												case 5:
													if (m.effect == 5) {
														i = 1
													} else if (m.param) {
														m.portaSpeed = m.param;
														m.param = 0
													}
													if (m.portaPeriod) {
														if (m.portaDir) {
															m.period -= m.portaSpeed;
															if (m.period <= m.portaPeriod) {
																m.period = m.portaPeriod;
																m.portaPeriod = 0
															}
														} else {
															m.period += m.portaSpeed;
															if (m.period >= m.portaPeriod) {
																m.period = m.portaPeriod;
																m.portaPeriod = 0
															}
														}
													}
													a.period = m.period;
													break;
												case 4:
												case 6:
													if (m.effect == 6) {
														i = 1
													} else if (m.param) {
														m.vibratoSpeed = m.param
													}
													l = m.vibratoPos >> 2 & 31;
													l = (m.vibratoSpeed & 15)
															* k[l] >> this.vibratoDepth;
													if (m.vibratoPos > 127)
														a.period = m.period - l;
													else
														a.period = m.period + l;
													l = m.vibratoSpeed >> 2 & 60;
													m.vibratoPos = m.vibratoPos
															+ l & 255;
													break;
												case 10:
													i = 1;
													break
												}
												if (i) {
													l = m.param >> 4;
													i = 0;
													if (l)
														m.volume += l;
													else
														m.volume -= m.param & 15;
													if (m.volume < 0)
														m.volume = 0;
													else if (m.volume > 64)
														m.volume = 64;
													a.volume = m.volume
												}
												m = m.next
											}
										}
										if (++this.tick == this.speed) {
											this.tick = 0;
											this.patternPos += 4;
											if (this.patternPos == 256
													|| this.jumpFlag) {
												this.patternPos = this.jumpFlag = 0;
												this.trackPos = ++this.trackPos & 127;
												if (this.trackPos == this.length) {
													this.trackPos = this.restart;
													this.mixer.complete = 1
												}
											}
										}
									}
								}
							});
			m.voices[0] = a(0);
			m.voices[0].next = m.voices[1] = a(1);
			m.voices[1].next = m.voices[2] = a(2);
			m.voices[2].next = m.voices[3] = a(3);
			m.track = new Uint16Array(128);
			return Object.seal(m)
		}
		var c = 1, d = 2, e = 3, f = 4, g = 5, j = [ 856, 808, 762, 720, 678,
				640, 604, 570, 538, 508, 480, 453, 428, 404, 381, 360, 339,
				320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170,
				160, 151, 143, 135, 127, 120, 113, 0 ], k = [ 0, 24, 49, 74,
				97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250, 253, 255,
				253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74,
				49, 24 ];
		window.neoart.MKPlayer = b
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				loopCtr : {
					value : 0,
					writable : true
				},
				loopPos : {
					value : 0,
					writable : true
				},
				step : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				param : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				pointer : {
					value : 0,
					writable : true
				},
				length : {
					value : 0,
					writable : true
				},
				loopPtr : {
					value : 0,
					writable : true
				},
				repeat : {
					value : 0,
					writable : true
				},
				finetune : {
					value : 0,
					writable : true
				},
				offset : {
					value : 0,
					writable : true
				},
				portaDir : {
					value : 0,
					writable : true
				},
				portaPeriod : {
					value : 0,
					writable : true
				},
				portaSpeed : {
					value : 0,
					writable : true
				},
				glissando : {
					value : 0,
					writable : true
				},
				tremoloParam : {
					value : 0,
					writable : true
				},
				tremoloPos : {
					value : 0,
					writable : true
				},
				tremoloWave : {
					value : 0,
					writable : true
				},
				vibratoParam : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				vibratoWave : {
					value : 0,
					writable : true
				},
				funkPos : {
					value : 0,
					writable : true
				},
				funkSpeed : {
					value : 0,
					writable : true
				},
				funkWave : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.enabled = 0;
						this.loopCtr = 0;
						this.loopPos = 0;
						this.step = 0;
						this.period = 0;
						this.effect = 0;
						this.param = 0;
						this.volume = 0;
						this.pointer = 0;
						this.length = 0;
						this.loopPtr = 0;
						this.repeat = 0;
						this.finetune = 0;
						this.offset = 0;
						this.portaDir = 0;
						this.portaPeriod = 0;
						this.portaSpeed = 0;
						this.glissando = 0;
						this.tremoloParam = 0;
						this.tremoloPos = 0;
						this.tremoloWave = 0;
						this.vibratoParam = 0;
						this.vibratoPos = 0;
						this.vibratoWave = 0;
						this.funkPos = 0;
						this.funkSpeed = 0;
						this.funkWave = 0
					}
				}
			})
		}
		function b() {
			var a = h();
			Object.defineProperties(a, {
				step : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c() {
			var a = i();
			Object.defineProperties(a, {
				finetune : {
					value : 0,
					writable : true
				},
				realLen : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function d(d) {
			var h = l(d);
			Object
					.defineProperties(
							h,
							{
								id : {
									value : "PTPlayer"
								},
								track : {
									value : null,
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								patternBreak : {
									value : 0,
									writable : true
								},
								patternDelay : {
									value : 0,
									writable : true
								},
								breakPos : {
									value : 0,
									writable : true
								},
								jumpFlag : {
									value : 0,
									writable : true
								},
								vibratoDepth : {
									value : 0,
									writable : true
								},
								force : {
									set : function(a) {
										if (a < e)
											a = e;
										else if (a > g)
											a = g;
										this.version = a;
										if (a < f)
											this.vibratoDepth = 6;
										else
											this.vibratoDepth = 7
									}
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.tempo = 125;
										this.speed = 6;
										this.trackPos = 0;
										this.patternPos = 0;
										this.patternBreak = 0;
										this.patternDelay = 0;
										this.breakPos = 0;
										this.jumpFlag = 0;
										this.reset();
										this.force = this.version;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.sample = this.samples[0];
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var d = 0, h, i, j, k, l, m = 0, n;
										if (a.length < 2106)
											return;
										a.position = 1080;
										i = a.readString(4);
										if (i != "M.K." && i != "M!K!")
											return;
										a.position = 0;
										this.title = a.readString(20);
										this.version = e;
										a.position += 22;
										for (h = 1; h < 32; ++h) {
											n = a.readUshort();
											if (!n) {
												this.samples[h] = null;
												a.position += 28;
												continue
											}
											l = c();
											a.position -= 24;
											l.name = a.readString(22);
											l.length = l.realLen = n << 1;
											a.position += 2;
											l.finetune = a.readUbyte() * 37;
											l.volume = a.readUbyte();
											l.loop = a.readUshort() << 1;
											l.repeat = a.readUshort() << 1;
											a.position += 22;
											l.pointer = m;
											m += l.length;
											this.samples[h] = l
										}
										a.position = 950;
										this.length = a.readUbyte();
										a.position++;
										for (h = 0; h < 128; ++h) {
											n = a.readUbyte() << 8;
											this.track[h] = n;
											if (n > d)
												d = n
										}
										a.position = 1084;
										d += 256;
										this.patterns.length = d;
										for (h = 0; h < d; ++h) {
											k = b();
											k.step = n = a.readUint();
											k.note = n >> 16 & 4095;
											k.effect = n >> 8 & 15;
											k.sample = n >> 24 & 240 | n >> 12
													& 15;
											k.param = n & 255;
											this.patterns[h] = k;
											if (k.sample > 31
													|| !this.samples[k.sample])
												k.sample = 0;
											if (k.effect == 15 && k.param > 31)
												this.version = f;
											if (k.effect == 8)
												this.version = g
										}
										this.mixer.store(a, m);
										for (h = 1; h < 32; ++h) {
											l = this.samples[h];
											if (!l)
												continue;
											if (l.loop || l.repeat > 4) {
												l.loopPtr = l.pointer + l.loop;
												l.length = l.loop + l.repeat
											} else {
												l.loopPtr = this.mixer.memory.length;
												l.repeat = 2
											}
											m = l.pointer + 2;
											for (j = l.pointer; j < m; ++j)
												this.mixer.memory[j] = 0
										}
										l = c();
										l.pointer = l.loopPtr = this.mixer.memory.length;
										l.length = l.repeat = 2;
										this.samples[0] = l
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, f, g = this.voices[0];
										if (!this.tick) {
											if (this.patternDelay) {
												this.effects()
											} else {
												c = this.track[this.trackPos]
														+ this.patternPos;
												while (g) {
													a = g.channel;
													g.enabled = 0;
													if (!g.step)
														a.period = g.period;
													d = this.patterns[c
															+ g.index];
													g.step = d.step;
													g.effect = d.effect;
													g.param = d.param;
													if (d.sample) {
														e = g.sample = this.samples[d.sample];
														g.pointer = e.pointer;
														g.length = e.length;
														g.loopPtr = g.funkWave = e.loopPtr;
														g.repeat = e.repeat;
														g.finetune = e.finetune;
														a.volume = g.volume = e.volume
													} else {
														e = g.sample
													}
													if (!d.note) {
														this.moreEffects(g);
														g = g.next;
														continue
													} else {
														if ((g.step & 4080) == 3664) {
															g.finetune = (g.param & 15) * 37
														} else if (g.effect == 3
																|| g.effect == 5) {
															if (d.note == g.period) {
																g.portaPeriod = 0
															} else {
																b = g.finetune;
																f = b + 37;
																for (; b < f; ++b)
																	if (d.note >= j[b])
																		break;
																if (b == f)
																	f--;
																if (b > 0) {
																	f = g.finetune / 37 >> 0 & 8;
																	if (f)
																		b--
																}
																g.portaPeriod = j[b];
																g.portaDir = d.note > g.portaPeriod ? 0
																		: 1
															}
														} else if (g.effect == 9) {
															this.moreEffects(g)
														}
													}
													for (b = 0; b < 37; ++b)
														if (d.note >= j[b])
															break;
													g.period = j[g.finetune + b];
													if ((g.step & 4080) == 3792) {
														if (g.funkSpeed)
															this.updateFunk(g);
														this.extended(g);
														g = g.next;
														continue
													}
													if (g.vibratoWave < 4)
														g.vibratoPos = 0;
													if (g.tremoloWave < 4)
														g.tremoloPos = 0;
													a.enabled = 0;
													a.pointer = g.pointer;
													a.length = g.length;
													a.period = g.period;
													g.enabled = 1;
													this.moreEffects(g);
													g = g.next
												}
												g = this.voices[0];
												while (g) {
													a = g.channel;
													if (g.enabled)
														a.enabled = 1;
													a.pointer = g.loopPtr;
													a.length = g.repeat;
													g = g.next
												}
											}
										} else {
											this.effects()
										}
										if (++this.tick == this.speed) {
											this.tick = 0;
											this.patternPos += 4;
											if (this.patternDelay)
												if (--this.patternDelay)
													this.patternPos -= 4;
											if (this.patternBreak) {
												this.patternBreak = 0;
												this.patternPos = this.breakPos;
												this.breakPos = 0
											}
											if (this.patternPos == 256
													|| this.jumpFlag) {
												this.patternPos = this.breakPos;
												this.breakPos = 0;
												this.jumpFlag = 0;
												if (++this.trackPos == this.length) {
													this.trackPos = 0;
													this.mixer.complete = 1
												}
											}
										}
									}
								},
								effects : {
									value : function() {
										var a, b, c, d, e, f = this.voices[0], g;
										while (f) {
											a = f.channel;
											if (f.funkSpeed)
												this.updateFunk(f);
											if ((f.step & 4095) == 0) {
												a.period = f.period;
												f = f.next;
												continue
											}
											switch (f.effect) {
											case 0:
												e = this.tick % 3;
												if (!e) {
													a.period = f.period;
													f = f.next;
													continue
												}
												if (e == 1)
													e = f.param >> 4;
												else
													e = f.param & 15;
												b = f.finetune;
												c = b + 37;
												for (; b < c; ++b)
													if (f.period >= j[b]) {
														a.period = j[b + e];
														break
													}
												break;
											case 1:
												f.period -= f.param;
												if (f.period < 113)
													f.period = 113;
												a.period = f.period;
												break;
											case 2:
												f.period += f.param;
												if (f.period > 856)
													f.period = 856;
												a.period = f.period;
												break;
											case 3:
											case 5:
												if (f.effect == 5) {
													d = 1
												} else {
													f.portaSpeed = f.param;
													f.param = 0
												}
												if (f.portaPeriod) {
													if (f.portaDir) {
														f.period -= f.portaSpeed;
														if (f.period <= f.portaPeriod) {
															f.period = f.portaPeriod;
															f.portaPeriod = 0
														}
													} else {
														f.period += f.portaSpeed;
														if (f.period >= f.portaPeriod) {
															f.period = f.portaPeriod;
															f.portaPeriod = 0
														}
													}
													if (f.glissando) {
														b = f.finetune;
														e = b + 37;
														for (; b < e; ++b)
															if (f.period >= j[b])
																break;
														if (b == e)
															b--;
														a.period = j[b]
													} else {
														a.period = f.period
													}
												}
												break;
											case 4:
											case 6:
												if (f.effect == 6) {
													d = 1
												} else if (f.param) {
													e = f.param & 15;
													if (e)
														f.vibratoParam = f.vibratoParam
																& 240 | e;
													e = f.param & 240;
													if (e)
														f.vibratoParam = f.vibratoParam
																& 15 | e
												}
												c = f.vibratoPos >> 2 & 31;
												g = f.vibratoWave & 3;
												if (g) {
													e = 255;
													c <<= 3;
													if (g == 1) {
														if (f.vibratoPos > 127)
															e -= c;
														else
															e = c
													}
												} else {
													e = k[c]
												}
												e = (f.vibratoParam & 15) * e >> this.vibratoDepth;
												if (f.vibratoPos > 127)
													a.period = f.period - e;
												else
													a.period = f.period + e;
												e = f.vibratoParam >> 2 & 60;
												f.vibratoPos = f.vibratoPos + e
														& 255;
												break;
											case 7:
												a.period = f.period;
												if (f.param) {
													e = f.param & 15;
													if (e)
														f.tremoloParam = f.tremoloParam
																& 240 | e;
													e = f.param & 240;
													if (e)
														f.tremoloParam = f.tremoloParam
																& 15 | e
												}
												c = f.tremoloPos >> 2 & 31;
												g = f.tremoloWave & 3;
												if (g) {
													e = 255;
													c <<= 3;
													if (g == 1) {
														if (f.tremoloPos > 127)
															e -= c;
														else
															e = c
													}
												} else {
													e = k[c]
												}
												e = (f.tremoloParam & 15) * e >> 6;
												if (f.tremoloPos > 127)
													a.volume = f.volume - e;
												else
													a.volume = f.volume + e;
												e = f.tremoloParam >> 2 & 60;
												f.tremoloPos = f.tremoloPos + e
														& 255;
												break;
											case 10:
												d = 1;
												break;
											case 14:
												this.extended(f);
												break
											}
											if (d) {
												d = 0;
												e = f.param >> 4;
												if (e)
													f.volume += e;
												else
													f.volume -= f.param & 15;
												if (f.volume < 0)
													f.volume = 0;
												else if (f.volume > 64)
													f.volume = 64;
												a.volume = f.volume
											}
											f = f.next
										}
									}
								},
								moreEffects : {
									value : function(a) {
										var b = a.channel, c;
										if (a.funkSpeed)
											this.updateFunk(a);
										switch (a.effect) {
										case 9:
											if (a.param)
												a.offset = a.param;
											c = a.offset << 8;
											if (c >= a.length) {
												a.length = 2
											} else {
												a.pointer += c;
												a.length -= c
											}
											break;
										case 11:
											this.trackPos = a.param - 1;
											this.breakPos = 0;
											this.jumpFlag = 1;
											break;
										case 12:
											a.volume = a.param;
											if (a.volume > 64)
												a.volume = 64;
											b.volume = a.volume;
											break;
										case 13:
											this.breakPos = (a.param >> 4) * 10
													+ (a.param & 15);
											if (this.breakPos > 63)
												this.breakPos = 0;
											else
												this.breakPos <<= 2;
											this.jumpFlag = 1;
											break;
										case 14:
											this.extended(a);
											break;
										case 15:
											if (!a.param)
												return;
											if (a.param < 32)
												this.speed = a.param;
											else
												this.mixer.samplesTick = this.sampleRate
														* 2.5 / a.param >> 0;
											this.tick = 0;
											break
										}
									}
								},
								extended : {
									value : function(a) {
										var b = a.channel, c = a.param >> 4, d, e, f, g = a.param & 15;
										switch (c) {
										case 0:
											this.mixer.filter.active = g;
											break;
										case 1:
											if (this.tick)
												return;
											a.period -= g;
											if (a.period < 113)
												a.period = 113;
											b.period = a.period;
											break;
										case 2:
											if (this.tick)
												return;
											a.period += g;
											if (a.period > 856)
												a.period = 856;
											b.period = a.period;
											break;
										case 3:
											a.glissando = g;
											break;
										case 4:
											a.vibratoWave = g;
											break;
										case 5:
											a.finetune = g * 37;
											break;
										case 6:
											if (this.tick)
												return;
											if (g) {
												if (a.loopCtr)
													a.loopCtr--;
												else
													a.loopCtr = g;
												if (a.loopCtr) {
													this.breakPos = a.loopPos << 2;
													this.patternBreak = 1
												}
											} else {
												a.loopPos = this.patternPos >> 2
											}
											break;
										case 7:
											a.tremoloWave = g;
											break;
										case 8:
											e = a.length - 2;
											f = this.mixer.memory;
											for (d = a.loopPtr; d < e;)
												f[d] = (f[d] + f[++d]) * .5;
											f[++d] = (f[d] + f[0]) * .5;
											break;
										case 9:
											if (this.tick || !g || !a.period)
												return;
											if (this.tick % g)
												return;
											b.enabled = 0;
											b.pointer = a.pointer;
											b.length = a.length;
											b.delay = 30;
											b.enabled = 1;
											b.pointer = a.loopPtr;
											b.length = a.repeat;
											b.period = a.period;
											break;
										case 10:
											if (this.tick)
												return;
											a.volume += g;
											if (a.volume > 64)
												a.volume = 64;
											b.volume = a.volume;
											break;
										case 11:
											if (this.tick)
												return;
											a.volume -= g;
											if (a.volume < 0)
												a.volume = 0;
											b.volume = a.volume;
											break;
										case 12:
											if (this.tick == g)
												b.volume = a.volume = 0;
											break;
										case 13:
											if (this.tick != g || !a.period)
												return;
											b.enabled = 0;
											b.pointer = a.pointer;
											b.length = a.length;
											b.delay = 30;
											b.enabled = 1;
											b.pointer = a.loopPtr;
											b.length = a.repeat;
											b.period = a.period;
											break;
										case 14:
											if (this.tick || this.patternDelay)
												return;
											this.patternDelay = ++g;
											break;
										case 15:
											if (this.tick)
												return;
											a.funkSpeed = g;
											if (g)
												this.updateFunk(a);
											break
										}
									}
								},
								updateFunk : {
									value : function(a) {
										var b = a.channel, c, d, f = m[a.funkSpeed];
										a.funkPos += f;
										if (a.funkPos < 128)
											return;
										a.funkPos = 0;
										if (this.version == e) {
											c = a.pointer + a.sample.realLen
													- a.repeat;
											d = a.funkWave + a.repeat;
											if (d > c) {
												d = a.loopPtr;
												b.length = a.repeat
											}
											b.pointer = a.funkWave = d
										} else {
											c = a.loopPtr + a.repeat;
											d = a.funkWave + 1;
											if (d >= c)
												d = a.loopPtr;
											this.mixer.memory[d] = -this.mixer.memory[d]
										}
									}
								}
							});
			h.voices[0] = a(0);
			h.voices[0].next = h.voices[1] = a(1);
			h.voices[1].next = h.voices[2] = a(2);
			h.voices[2].next = h.voices[3] = a(3);
			h.track = new Uint16Array(128);
			return Object.seal(h)
		}
		var e = 1, f = 2, g = 3, j = [ 856, 808, 762, 720, 678, 640, 604, 570,
				538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302, 285,
				269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143,
				135, 127, 120, 113, 0, 850, 802, 757, 715, 674, 637, 601, 567,
				535, 505, 477, 450, 425, 401, 379, 357, 337, 318, 300, 284,
				268, 253, 239, 225, 213, 201, 189, 179, 169, 159, 150, 142,
				134, 126, 119, 113, 0, 844, 796, 752, 709, 670, 632, 597, 563,
				532, 502, 474, 447, 422, 398, 376, 355, 335, 316, 298, 282,
				266, 251, 237, 224, 211, 199, 188, 177, 167, 158, 149, 141,
				133, 125, 118, 112, 0, 838, 791, 746, 704, 665, 628, 592, 559,
				528, 498, 470, 444, 419, 395, 373, 352, 332, 314, 296, 280,
				264, 249, 235, 222, 209, 198, 187, 176, 166, 157, 148, 140,
				132, 125, 118, 111, 0, 832, 785, 741, 699, 660, 623, 588, 555,
				524, 495, 467, 441, 416, 392, 370, 350, 330, 312, 294, 278,
				262, 247, 233, 220, 208, 196, 185, 175, 165, 156, 147, 139,
				131, 124, 117, 110, 0, 826, 779, 736, 694, 655, 619, 584, 551,
				520, 491, 463, 437, 413, 390, 368, 347, 328, 309, 292, 276,
				260, 245, 232, 219, 206, 195, 184, 174, 164, 155, 146, 138,
				130, 123, 116, 109, 0, 820, 774, 730, 689, 651, 614, 580, 547,
				516, 487, 460, 434, 410, 387, 365, 345, 325, 307, 290, 274,
				258, 244, 230, 217, 205, 193, 183, 172, 163, 154, 145, 137,
				129, 122, 115, 109, 0, 814, 768, 725, 684, 646, 610, 575, 543,
				513, 484, 457, 431, 407, 384, 363, 342, 323, 305, 288, 272,
				256, 242, 228, 216, 204, 192, 181, 171, 161, 152, 144, 136,
				128, 121, 114, 108, 0, 907, 856, 808, 762, 720, 678, 640, 604,
				570, 538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302,
				285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151,
				143, 135, 127, 120, 0, 900, 850, 802, 757, 715, 675, 636, 601,
				567, 535, 505, 477, 450, 425, 401, 379, 357, 337, 318, 300,
				284, 268, 253, 238, 225, 212, 200, 189, 179, 169, 159, 150,
				142, 134, 126, 119, 0, 894, 844, 796, 752, 709, 670, 632, 597,
				563, 532, 502, 474, 447, 422, 398, 376, 355, 335, 316, 298,
				282, 266, 251, 237, 223, 211, 199, 188, 177, 167, 158, 149,
				141, 133, 125, 118, 0, 887, 838, 791, 746, 704, 665, 628, 592,
				559, 528, 498, 470, 444, 419, 395, 373, 352, 332, 314, 296,
				280, 264, 249, 235, 222, 209, 198, 187, 176, 166, 157, 148,
				140, 132, 125, 118, 0, 881, 832, 785, 741, 699, 660, 623, 588,
				555, 524, 494, 467, 441, 416, 392, 370, 350, 330, 312, 294,
				278, 262, 247, 233, 220, 208, 196, 185, 175, 165, 156, 147,
				139, 131, 123, 117, 0, 875, 826, 779, 736, 694, 655, 619, 584,
				551, 520, 491, 463, 437, 413, 390, 368, 347, 328, 309, 292,
				276, 260, 245, 232, 219, 206, 195, 184, 174, 164, 155, 146,
				138, 130, 123, 116, 0, 868, 820, 774, 730, 689, 651, 614, 580,
				547, 516, 487, 460, 434, 410, 387, 365, 345, 325, 307, 290,
				274, 258, 244, 230, 217, 205, 193, 183, 172, 163, 154, 145,
				137, 129, 122, 115, 0, 862, 814, 768, 725, 684, 646, 610, 575,
				543, 513, 484, 457, 431, 407, 384, 363, 342, 323, 305, 288,
				272, 256, 242, 228, 216, 203, 192, 181, 171, 161, 152, 144,
				136, 128, 121, 114, 0 ], k = [ 0, 24, 49, 74, 97, 120, 141,
				161, 180, 197, 212, 224, 235, 244, 250, 253, 255, 253, 250,
				244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74, 49, 24 ], m = [
				0, 5, 6, 7, 8, 10, 11, 13, 16, 19, 22, 26, 32, 43, 64, 128 ];
		window.neoart.PTPlayer = d
	})();
	(function() {
		function a(a, b) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				bitFlag : {
					value : b,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				trackPtr : {
					value : 0,
					writable : true
				},
				trackPos : {
					value : 0,
					writable : true
				},
				patternPos : {
					value : 0,
					writable : true
				},
				tick : {
					value : 0,
					writable : true
				},
				busy : {
					value : 0,
					writable : true
				},
				flags : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				portaSpeed : {
					value : 0,
					writable : true
				},
				vibratoPtr : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				synthPos : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.trackPtr = 0;
						this.trackPos = 0;
						this.patternPos = 0;
						this.tick = 1;
						this.busy = 1;
						this.flags = 0;
						this.note = 0;
						this.period = 0;
						this.volume = 0;
						this.portaSpeed = 0;
						this.vibratoPtr = 0;
						this.vibratoPos = 0;
						this.synthPos = 0
					}
				}
			})
		}
		function b() {
			var a = i();
			Object.defineProperties(a, {
				relative : {
					value : 0,
					writable : true
				},
				divider : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				hiPos : {
					value : 0,
					writable : true
				},
				loPos : {
					value : 0,
					writable : true
				},
				wave : {
					value : [],
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c() {
			return Object.create(null, {
				speed : {
					value : 0,
					writable : true
				},
				tracks : {
					value : null,
					writable : true
				}
			})
		}
		function d(d) {
			var e = l(d);
			Object
					.defineProperties(
							e,
							{
								id : {
									value : "RHPlayer"
								},
								songs : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								song : {
									value : null,
									writable : true
								},
								periods : {
									value : 0,
									writable : true
								},
								vibrato : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								stream : {
									value : null,
									writable : true
								},
								complete : {
									value : 0,
									writable : true
								},
								variant : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a, b, c, d = this.voices[3];
										this.reset();
										this.song = this.songs[this.playSong];
										this.complete = 15;
										for (a = 0; a < this.samples.length; ++a) {
											c = this.samples[a];
											if (c.wave.length) {
												for (b = 0; b < c.length; ++b)
													this.mixer.memory[c.pointer
															+ b] = c.wave[b]
											}
										}
										while (d) {
											d.initialize();
											d.channel = this.mixer.channels[d.index];
											d.trackPtr = this.song.tracks[d.index];
											d.trackPos = 4;
											this.stream.position = d.trackPtr;
											d.patternPos = this.stream
													.readUint();
											d = d.next
										}
									}
								},
								loader : {
									value : function(a) {
										var d, e, f, g, h, i, j, k, l, m, n, o, p;
										a.position = 44;
										while (a.position < 1024) {
											p = a.readUshort();
											if (p == 32272 || p == 32288) {
												p = a.readUshort();
												if (p == 16890) {
													d = a.position
															+ a.readUshort();
													p = a.readUshort();
													if (p == 53756) {
														i = d + a.readUint();
														this.mixer.loopLen = 64;
														a.position += 2
													} else {
														i = d;
														this.mixer.loopLen = 512
													}
													j = a.position
															+ a.readUshort();
													p = a.readUbyte();
													if (p == 114)
														k = a.readUbyte()
												}
											} else if (p == 20937) {
												a.position += 2;
												p = a.readUshort();
												if (p == 17914) {
													o = a.position
															+ a.readUshort();
													a.position += 2;
													while (1) {
														p = a.readUshort();
														if (p == 19450) {
															n = a.position
																	+ a
																			.readUshort();
															break
														}
													}
												}
											} else if (p == 49404) {
												a.position += 2;
												p = a.readUshort();
												if (p == 16875)
													m = a.readUshort()
											} else if (p == 13421) {
												a.position += 2;
												p = a.readUshort();
												if (p == 18938)
													this.vibrato = a.position
															+ a.readUshort()
											} else if (p == 16960) {
												p = a.readUshort();
												if (p == 17914) {
													this.periods = a.position
															+ a.readUshort();
													break
												}
											}
										}
										if (!j || !i || !k || !m)
											return;
										a.position = i;
										this.samples = [];
										k++;
										for (d = 0; d < k; ++d) {
											h = b();
											h.length = a.readUint();
											h.relative = parseInt(3579545 / a
													.readUshort());
											h.pointer = this.mixer.store(a,
													h.length);
											this.samples[d] = h
										}
										a.position = j;
										for (d = 0; d < k; ++d) {
											h = this.samples[d];
											a.position += 4;
											h.loopPtr = a.readInt();
											a.position += 6;
											h.volume = a.readUshort();
											if (n) {
												h.divider = a.readUshort();
												h.vibrato = a.readUshort();
												h.hiPos = a.readUshort();
												h.loPos = a.readUshort();
												a.position += 8
											}
										}
										if (n) {
											a.position = n;
											d = n - j >> 5;
											f = d + 3;
											this.variant = 1;
											if (d >= k) {
												for (e = k; e < d; ++e)
													this.samples[e] = b()
											}
											for (; d < f; ++d) {
												h = b();
												a.position += 4;
												h.loopPtr = a.readInt();
												h.length = a.readUshort();
												h.relative = a.readUshort();
												a.position += 2;
												h.volume = a.readUshort();
												h.divider = a.readUshort();
												h.vibrato = a.readUshort();
												h.hiPos = a.readUshort();
												h.loPos = a.readUshort();
												g = a.position;
												a.position = o;
												a.position = a.readInt();
												h.pointer = this.mixer.memory.length;
												this.mixer.memory.length += h.length;
												for (e = 0; e < h.length; ++e)
													h.wave[e] = a.readByte();
												this.samples[d] = h;
												o += 4;
												a.position = g
											}
										}
										a.position = m;
										this.songs = [];
										p = 65536;
										while (1) {
											l = c();
											a.position++;
											l.tracks = new Uint32Array(4);
											l.speed = a.readUbyte();
											for (d = 0; d < 4; ++d) {
												e = a.readUint();
												if (e < p)
													p = e;
												l.tracks[d] = e
											}
											this.songs.push(l);
											if (p - a.position < 18)
												break
										}
										this.lastSong = this.songs.length - 1;
										a.length = i;
										a.position = 352;
										while (a.position < 512) {
											p = a.readUshort();
											if (p == 45116) {
												p = a.readUshort();
												if (p == 133) {
													this.variant = 2
												} else if (p == 134) {
													this.variant = 4
												} else if (p == 135) {
													this.variant = 3
												}
											}
										}
										this.stream = a;
										this.version = 1
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e = this.voices[3];
										while (e) {
											a = e.channel;
											this.stream.position = e.patternPos;
											c = e.sample;
											if (!e.busy) {
												e.busy = 1;
												if (c.loopPtr == 0) {
													a.pointer = this.mixer.loopPtr;
													a.length = this.mixer.loopLen
												} else if (c.loopPtr > 0) {
													a.pointer = c.pointer
															+ c.loopPtr;
													a.length = c.length
															- c.loopPtr
												}
											}
											if (--e.tick == 0) {
												e.flags = 0;
												b = 1;
												while (b) {
													d = this.stream.readByte();
													if (d < 0) {
														switch (d) {
														case -121:
															if (this.variant == 3)
																e.volume = this.stream
																		.readUbyte();
															break;
														case -122:
															if (this.variant == 4)
																e.volume = this.stream
																		.readUbyte();
															break;
														case -123:
															if (this.variant > 1)
																this.mixer.complete = 1;
															break;
														case -124:
															this.stream.position = e.trackPtr
																	+ e.trackPos;
															d = this.stream
																	.readUint();
															e.trackPos += 4;
															if (!d) {
																this.stream.position = e.trackPtr;
																d = this.stream
																		.readUint();
																e.trackPos = 4;
																if (!this.loopSong) {
																	this.complete &= ~e.bitFlag;
																	if (!this.complete)
																		this.mixer.complete = 1
																}
															}
															this.stream.position = d;
															break;
														case -125:
															if (this.variant == 4)
																e.flags |= 4;
															break;
														case -126:
															e.tick = this.song.speed
																	* this.stream
																			.readByte();
															e.patternPos = this.stream.position;
															a.pointer = this.mixer.loopPtr;
															a.length = this.mixer.loopLen;
															b = 0;
															break;
														case -127:
															e.portaSpeed = this.stream
																	.readByte();
															e.flags |= 1;
															break;
														case -128:
															d = this.stream
																	.readByte();
															if (d < 0)
																d = 0;
															e.sample = c = this.samples[d];
															e.vibratoPtr = this.vibrato
																	+ c.vibrato;
															e.vibratoPos = e.vibratoPtr;
															break
														}
													} else {
														e.tick = this.song.speed
																* d;
														e.note = this.stream
																.readByte();
														e.patternPos = this.stream.position;
														e.synthPos = c.loPos;
														e.vibratoPos = e.vibratoPtr;
														a.pointer = c.pointer;
														a.length = c.length;
														a.volume = e.volume ? e.volume
																: c.volume;
														this.stream.position = this.periods
																+ (e.note << 1);
														d = this.stream
																.readUshort()
																* c.relative;
														a.period = e.period = d >> 10;
														a.enabled = 1;
														e.busy = b = 0
													}
												}
											} else {
												if (e.tick == 1) {
													if (this.variant != 4
															|| !(e.flags & 4))
														a.enabled = 0
												}
												if (e.flags & 1)
													a.period = e.period += e.portaSpeed;
												if (c.divider) {
													this.stream.position = e.vibratoPos;
													d = this.stream.readByte();
													if (d == -124) {
														this.stream.position = e.vibratoPtr;
														d = this.stream
																.readByte()
													}
													e.vibratoPos = this.stream.position;
													d = parseInt(e.period
															/ c.divider)
															* d;
													a.period = e.period + d
												}
											}
											if (c.hiPos) {
												d = 0;
												if (e.flags & 2) {
													e.synthPos--;
													if (e.synthPos <= c.loPos) {
														e.flags &= -3;
														d = 60
													}
												} else {
													e.synthPos++;
													if (e.synthPos > c.hiPos) {
														e.flags |= 2;
														d = 60
													}
												}
												this.mixer.memory[c.pointer
														+ e.synthPos] = d
											}
											e = e.next
										}
									}
								}
							});
			e.voices[3] = a(3, 8);
			e.voices[3].next = e.voices[2] = a(2, 4);
			e.voices[2].next = e.voices[1] = a(1, 2);
			e.voices[1].next = e.voices[0] = a(0, 1);
			return Object.seal(e)
		}
		window.neoart.RHPlayer = d
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				step : {
					value : 0,
					writable : true
				},
				row : {
					value : 0,
					writable : true
				},
				sample : {
					value : 0,
					writable : true
				},
				samplePtr : {
					value : 0,
					writable : true
				},
				sampleLen : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				noteTimer : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				bendTo : {
					value : 0,
					writable : true
				},
				bendSpeed : {
					value : 0,
					writable : true
				},
				arpeggioCtr : {
					value : 0,
					writable : true
				},
				envelopeCtr : {
					value : 0,
					writable : true
				},
				pitchCtr : {
					value : 0,
					writable : true
				},
				pitchFallCtr : {
					value : 0,
					writable : true
				},
				sustainCtr : {
					value : 0,
					writable : true
				},
				phaseTimer : {
					value : 0,
					writable : true
				},
				phaseSpeed : {
					value : 0,
					writable : true
				},
				wavePos : {
					value : 0,
					writable : true
				},
				waveList : {
					value : 0,
					writable : true
				},
				waveTimer : {
					value : 0,
					writable : true
				},
				waitCtr : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.step = 0;
						this.row = 0;
						this.sample = 0;
						this.samplePtr = -1;
						this.sampleLen = 0;
						this.note = 0;
						this.noteTimer = 0;
						this.period = 39321;
						this.volume = 0;
						this.bendTo = 0;
						this.bendSpeed = 0;
						this.arpeggioCtr = 0;
						this.envelopeCtr = 0;
						this.pitchCtr = 0;
						this.pitchFallCtr = 0;
						this.sustainCtr = 0;
						this.phaseTimer = 0;
						this.phaseSpeed = 0;
						this.wavePos = 0;
						this.waveList = 0;
						this.waveTimer = 0;
						this.waitCtr = 0
					}
				}
			})
		}
		function b() {
			var a = h();
			Object.defineProperties(a, {
				speed : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function c() {
			var a = i();
			Object.defineProperties(a, {
				waveform : {
					value : 0,
					writable : true
				},
				arpeggio : {
					value : null,
					writable : true
				},
				attackSpeed : {
					value : 0,
					writable : true
				},
				attackMax : {
					value : 0,
					writable : true
				},
				decaySpeed : {
					value : 0,
					writable : true
				},
				decayMin : {
					value : 0,
					writable : true
				},
				sustain : {
					value : 0,
					writable : true
				},
				releaseSpeed : {
					value : 0,
					writable : true
				},
				releaseMin : {
					value : 0,
					writable : true
				},
				phaseShift : {
					value : 0,
					writable : true
				},
				phaseSpeed : {
					value : 0,
					writable : true
				},
				finetune : {
					value : 0,
					writable : true
				},
				pitchFall : {
					value : 0,
					writable : true
				}
			});
			a.arpeggio = new Uint8Array(16);
			return Object.seal(a)
		}
		function d(d) {
			var h = l(d);
			Object
					.defineProperties(
							h,
							{
								id : {
									value : "S1Player"
								},
								tracksPtr : {
									value : null,
									writable : true
								},
								tracks : {
									value : [],
									writable : true
								},
								patternsPtr : {
									value : null,
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								waveLists : {
									value : null,
									writable : true
								},
								speedDef : {
									value : 0,
									writable : true
								},
								patternDef : {
									value : 0,
									writable : true
								},
								mix1Speed : {
									value : 0,
									writable : true
								},
								mix2Speed : {
									value : 0,
									writable : true
								},
								mix1Dest : {
									value : 0,
									writable : true
								},
								mix2Dest : {
									value : 0,
									writable : true
								},
								mix1Source1 : {
									value : 0,
									writable : true
								},
								mix1Source2 : {
									value : 0,
									writable : true
								},
								mix2Source1 : {
									value : 0,
									writable : true
								},
								mix2Source2 : {
									value : 0,
									writable : true
								},
								doFilter : {
									value : 0,
									writable : true
								},
								doReset : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								trackEnd : {
									value : 0,
									writable : true
								},
								trackLen : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								patternEnd : {
									value : 0,
									writable : true
								},
								patternLen : {
									value : 0,
									writable : true
								},
								mix1Ctr : {
									value : 0,
									writable : true
								},
								mix2Ctr : {
									value : 0,
									writable : true
								},
								mix1Pos : {
									value : 0,
									writable : true
								},
								mix2Pos : {
									value : 0,
									writable : true
								},
								audPtr : {
									value : 0,
									writable : true
								},
								audLen : {
									value : 0,
									writable : true
								},
								audPer : {
									value : 0,
									writable : true
								},
								audVol : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a, b, c = this.voices[0];
										this.reset();
										this.speed = this.speedDef;
										this.tick = this.speedDef;
										this.trackPos = 1;
										this.trackEnd = 0;
										this.patternPos = -1;
										this.patternEnd = 0;
										this.patternLen = this.patternDef;
										this.mix1Ctr = this.mix1Pos = 0;
										this.mix2Ctr = this.mix2Pos = 0;
										while (c) {
											c.initialize();
											a = this.mixer.channels[c.index];
											c.channel = a;
											c.step = this.tracksPtr[c.index];
											b = this.tracks[c.step];
											c.row = this.patternsPtr[b.pattern];
											c.sample = this.patterns[c.row].sample;
											a.length = 32;
											a.period = c.period;
											a.enabled = 1;
											c = c.next
										}
									}
								},
								loader : {
									value : function(a) {
										var d, h, i, k, l, m, n, q, r, s, t, u, v, w, x, y;
										while (a.bytesAvailable > 8) {
											s = a.readUshort();
											if (s != 16890)
												continue;
											k = a.readUshort();
											s = a.readUshort();
											if (s != 53736)
												continue;
											s = a.readUshort();
											if (s == 65492) {
												if (k == 4076)
													y = e;
												else if (k == 5222)
													y = o;
												else
													y = k;
												n = k + a.position - 6;
												break
											}
										}
										if (!n)
											return;
										a.position = n;
										i = a.readString(32);
										if (i != " SID-MON BY R.v.VLIET  (c) 1988 ")
											return;
										a.position = n - 44;
										s = a.readUint();
										for (h = 1; h < 4; ++h)
											this.tracksPtr[h] = (a.readUint() - s) / 6 >> 0;
										a.position = n - 8;
										s = a.readUint();
										m = a.readUint();
										if (m < s)
											m = a.length - n;
										v = m - s >> 2;
										this.patternsPtr = new Uint32Array(v);
										a.position = n + s + 4;
										for (h = 1; h < v; ++h) {
											s = a.readUint() / 5 >> 0;
											if (s == 0) {
												v = h;
												break
											}
											this.patternsPtr[h] = s
										}
										this.patternsPtr.length = v;
										a.position = n - 44;
										s = a.readUint();
										a.position = n - 28;
										m = (a.readUint() - s) / 6 >> 0;
										this.tracks.length = m;
										a.position = n + s;
										for (h = 0; h < m; ++h) {
											t = j();
											t.pattern = a.readUint();
											if (t.pattern >= v)
												t.pattern = 0;
											a.readByte();
											t.transpose = a.readByte();
											if (t.transpose < -99
													|| t.transpose > 99)
												t.transpose = 0;
											this.tracks[h] = t
										}
										a.position = n - 24;
										s = a.readUint();
										x = a.readUint() - s;
										for (h = 0; h < 32; ++h)
											this.mixer.memory[h] = 0;
										this.mixer.store(a, x, n + s);
										x >>= 5;
										a.position = n - 16;
										s = a.readUint();
										m = a.readUint() - s + 16;
										k = x + 2 << 4;
										this.waveLists = new Uint8Array(
												m < k ? k : m);
										a.position = n + s;
										h = 0;
										while (h < k) {
											this.waveLists[h++] = h >> 4;
											this.waveLists[h++] = 255;
											this.waveLists[h++] = 255;
											this.waveLists[h++] = 16;
											h += 12
										}
										for (h = 16; h < m; ++h)
											this.waveLists[h] = a.readUbyte();
										a.position = n - 20;
										a.position = n + a.readUint();
										this.mix1Source1 = a.readUint();
										this.mix2Source1 = a.readUint();
										this.mix1Source2 = a.readUint();
										this.mix2Source2 = a.readUint();
										this.mix1Dest = a.readUint();
										this.mix2Dest = a.readUint();
										this.patternDef = a.readUint();
										this.trackLen = a.readUint();
										this.speedDef = a.readUint();
										this.mix1Speed = a.readUint();
										this.mix2Speed = a.readUint();
										if (this.mix1Source1 > x)
											this.mix1Source1 = 0;
										if (this.mix2Source1 > x)
											this.mix2Source1 = 0;
										if (this.mix1Source2 > x)
											this.mix1Source2 = 0;
										if (this.mix2Source2 > x)
											this.mix2Source2 = 0;
										if (this.mix1Dest > x)
											this.mix1Speed = 0;
										if (this.mix2Dest > x)
											this.mix2Speed = 0;
										if (this.speedDef == 0)
											this.speedDef = 4;
										a.position = n - 28;
										k = a.readUint();
										u = a.readUint() - k >> 5;
										if (u > 63)
											u = 63;
										m = u + 1;
										a.position = n - 4;
										s = a.readUint();
										if (s == 1) {
											a.position = 1820;
											s = a.readUshort();
											if (s != 19962) {
												a.position = 1788;
												s = a.readUshort();
												if (s != 19962) {
													this.version = 0;
													return
												}
											}
											a.position += a.readUshort();
											this.samples.length = m + 3;
											for (h = 0; h < 3; ++h) {
												r = c();
												r.waveform = 16 + h;
												r.length = p[h];
												r.pointer = this.mixer.store(a,
														r.length);
												r.loop = r.loopPtr = 0;
												r.repeat = 4;
												r.volume = 64;
												this.samples[m + h] = r;
												a.position += r.length
											}
										} else {
											this.samples.length = m;
											a.position = n + s;
											d = a.readUint();
											w = (d >> 5) + 15;
											l = a.position;
											d += l
										}
										r = c();
										this.samples[0] = r;
										a.position = n + k;
										for (h = 1; h < m; ++h) {
											r = c();
											r.waveform = a.readUint();
											for (k = 0; k < 16; ++k)
												r.arpeggio[k] = a.readUbyte();
											r.attackSpeed = a.readUbyte();
											r.attackMax = a.readUbyte();
											r.decaySpeed = a.readUbyte();
											r.decayMin = a.readUbyte();
											r.sustain = a.readUbyte();
											a.readByte();
											r.releaseSpeed = a.readUbyte();
											r.releaseMin = a.readUbyte();
											r.phaseShift = a.readUbyte();
											r.phaseSpeed = a.readUbyte();
											r.finetune = a.readUbyte();
											r.pitchFall = a.readByte();
											if (y == o) {
												r.pitchFall = r.finetune;
												r.finetune = 0
											} else {
												if (r.finetune > 15)
													r.finetune = 0;
												r.finetune *= 67
											}
											if (r.phaseShift > x) {
												r.phaseShift = 0;
												r.phaseSpeed = 0
											}
											if (r.waveform > 15) {
												if (w > 15 && r.waveform > w) {
													r.waveform = 0
												} else {
													s = l
															+ (r.waveform - 16 << 5);
													if (s >= a.length)
														continue;
													k = a.position;
													a.position = s;
													r.pointer = a.readUint();
													r.loop = a.readUint();
													r.length = a.readUint();
													r.name = a.readString(20);
													if (r.loop == 0
															|| r.loop == 99999
															|| r.loop == 199999
															|| r.loop >= r.length) {
														r.loop = 0;
														r.repeat = y == e ? 2
																: 4
													} else {
														r.repeat = r.length
																- r.loop;
														r.loop -= r.pointer
													}
													r.length -= r.pointer;
													if (r.length < r.loop
															+ r.repeat)
														r.length = r.loop
																+ r.repeat;
													r.pointer = this.mixer
															.store(
																	a,
																	r.length,
																	d
																			+ r.pointer);
													if (r.repeat < 6
															|| r.loop == 0)
														r.loopPtr = 0;
													else
														r.loopPtr = r.pointer
																+ r.loop;
													a.position = k
												}
											} else if (r.waveform > x) {
												r.waveform = 0
											}
											this.samples[h] = r
										}
										a.position = n - 12;
										s = a.readUint();
										m = (a.readUint() - s) / 5 >> 0;
										this.patterns.length = m;
										a.position = n + s;
										for (h = 0; h < m; ++h) {
											q = b();
											q.note = a.readUbyte();
											q.sample = a.readUbyte();
											q.effect = a.readUbyte();
											q.param = a.readUbyte();
											q.speed = a.readUbyte();
											if (y == o) {
												if (q.note > 0 && q.note < 255)
													q.note += 469;
												if (q.effect > 0
														&& q.effect < 255)
													q.effect += 469;
												if (q.sample > 59)
													q.sample = u
															+ (q.sample - 60)
											} else if (q.sample > u) {
												q.sample = 0
											}
											this.patterns[h] = q
										}
										if (y == f || y == g || y == o) {
											if (y == f)
												this.mix1Speed = this.mix2Speed = 0;
											this.doReset = this.doFilter = 0
										} else {
											this.doReset = this.doFilter = 1
										}
										this.version = 1
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e = this.mixer.memory, f, g, h, i, j, k, l = this.voices[0];
										while (l) {
											a = l.channel;
											this.audPtr = -1;
											this.audLen = this.audPer = this.audVol = 0;
											if (this.tick == 0) {
												if (this.patternEnd) {
													if (this.trackEnd)
														l.step = this.tracksPtr[l.index];
													else
														l.step++;
													j = this.tracks[l.step];
													l.row = this.patternsPtr[j.pattern];
													if (this.doReset)
														l.noteTimer = 0
												}
												if (l.noteTimer == 0) {
													f = this.patterns[l.row];
													if (f.sample == 0) {
														if (f.note) {
															l.noteTimer = f.speed;
															if (l.waitCtr) {
																g = this.samples[l.sample];
																this.audPtr = g.pointer;
																this.audLen = g.length;
																l.samplePtr = g.loopPtr;
																l.sampleLen = g.repeat;
																l.waitCtr = 1;
																a.enabled = 0
															}
														}
													} else {
														g = this.samples[f.sample];
														if (l.waitCtr)
															a.enabled = l.waitCtr = 0;
														if (g.waveform > 15) {
															this.audPtr = g.pointer;
															this.audLen = g.length;
															l.samplePtr = g.loopPtr;
															l.sampleLen = g.repeat;
															l.waitCtr = 1
														} else {
															l.wavePos = 0;
															l.waveList = g.waveform;
															d = l.waveList << 4;
															this.audPtr = this.waveLists[d] << 5;
															this.audLen = 32;
															l.waveTimer = this.waveLists[++d]
														}
														l.noteTimer = f.speed;
														l.sample = f.sample;
														l.envelopeCtr = l.pitchCtr = l.pitchFallCtr = 0
													}
													if (f.note) {
														l.noteTimer = f.speed;
														if (f.note != 255) {
															g = this.samples[l.sample];
															j = this.tracks[l.step];
															l.note = f.note
																	+ j.transpose;
															l.period = this.audPer = q[1
																	+ g.finetune
																	+ l.note];
															l.phaseSpeed = g.phaseSpeed;
															l.bendSpeed = l.volume = 0;
															l.envelopeCtr = l.pitchCtr = l.pitchFallCtr = 0;
															switch (f.effect) {
															case 0:
																if (f.param == 0)
																	break;
																g.attackSpeed = f.param;
																g.attackMax = f.param;
																l.waveTimer = 0;
																break;
															case 2:
																this.speed = f.param;
																l.waveTimer = 0;
																break;
															case 3:
																this.patternLen = f.param;
																l.waveTimer = 0;
																break;
															default:
																l.bendTo = f.effect
																		+ j.transpose;
																l.bendSpeed = f.param;
																break
															}
														}
													}
													l.row++
												} else {
													l.noteTimer--
												}
											}
											g = this.samples[l.sample];
											this.audVol = l.volume;
											switch (l.envelopeCtr) {
											case 8:
												break;
											case 0:
												this.audVol += g.attackSpeed;
												if (this.audVol > g.attackMax) {
													this.audVol = g.attackMax;
													l.envelopeCtr += 2
												}
												break;
											case 2:
												this.audVol -= g.decaySpeed;
												if (this.audVol <= g.decayMin
														|| this.audVol < -256) {
													this.audVol = g.decayMin;
													l.envelopeCtr += 2;
													l.sustainCtr = g.sustain
												}
												break;
											case 4:
												l.sustainCtr--;
												if (l.sustainCtr == 0
														|| l.sustainCtr == -256)
													l.envelopeCtr += 2;
												break;
											case 6:
												this.audVol -= g.releaseSpeed;
												if (this.audVol <= g.releaseMin
														|| this.audVol < -256) {
													this.audVol = g.releaseMin;
													l.envelopeCtr = 8
												}
												break
											}
											l.volume = this.audVol;
											l.arpeggioCtr = ++l.arpeggioCtr & 15;
											d = g.finetune
													+ g.arpeggio[l.arpeggioCtr]
													+ l.note;
											l.period = this.audPer = q[d];
											if (l.bendSpeed) {
												k = q[g.finetune + l.bendTo];
												d = ~l.bendSpeed + 1;
												if (d < -128)
													d &= 255;
												l.pitchCtr += d;
												l.period += l.pitchCtr;
												if (d < 0 && l.period <= k
														|| d > 0
														&& l.period >= k) {
													l.note = l.bendTo;
													l.period = k;
													l.bendSpeed = 0;
													l.pitchCtr = 0
												}
											}
											if (g.phaseShift) {
												if (l.phaseSpeed) {
													l.phaseSpeed--
												} else {
													l.phaseTimer = ++l.phaseTimer & 31;
													d = (g.phaseShift << 5)
															+ l.phaseTimer;
													l.period += e[d] >> 2
												}
											}
											l.pitchFallCtr -= g.pitchFall;
											if (l.pitchFallCtr < -256)
												l.pitchFallCtr += 256;
											l.period += l.pitchFallCtr;
											if (l.waitCtr == 0) {
												if (l.waveTimer) {
													l.waveTimer--
												} else {
													if (l.wavePos < 16) {
														d = (l.waveList << 4)
																+ l.wavePos;
														k = this.waveLists[d++];
														if (k == 255) {
															l.wavePos = this.waveLists[d] & 254
														} else {
															this.audPtr = k << 5;
															l.waveTimer = this.waveLists[d];
															l.wavePos += 2
														}
													}
												}
											}
											if (this.audPtr > -1)
												a.pointer = this.audPtr;
											if (this.audPer != 0)
												a.period = l.period;
											if (this.audLen != 0)
												a.length = this.audLen;
											if (g.volume)
												a.volume = g.volume;
											else
												a.volume = this.audVol >> 2;
											a.enabled = 1;
											l = l.next
										}
										this.trackEnd = this.patternEnd = 0;
										if (++this.tick > this.speed) {
											this.tick = 0;
											if (++this.patternPos == this.patternLen) {
												this.patternPos = 0;
												this.patternEnd = 1;
												if (++this.trackPos == this.trackLen)
													this.trackPos = this.trackEnd = this.mixer.complete = 1
											}
										}
										if (this.mix1Speed) {
											if (this.mix1Ctr == 0) {
												this.mix1Ctr = this.mix1Speed;
												d = this.mix1Pos = ++this.mix1Pos & 31;
												b = (this.mix1Dest << 5) + 31;
												h = (this.mix1Source1 << 5) + 31;
												i = this.mix1Source2 << 5;
												for (c = 31; c > -1; --c) {
													e[b--] = e[h--] + e[i + d] >> 1;
													d = --d & 31
												}
											}
											this.mix1Ctr--
										}
										if (this.mix2Speed) {
											if (this.mix2Ctr == 0) {
												this.mix2Ctr = this.mix2Speed;
												d = this.mix2Pos = ++this.mix2Pos & 31;
												b = (this.mix2Dest << 5) + 31;
												h = (this.mix2Source1 << 5) + 31;
												i = this.mix2Source2 << 5;
												for (c = 31; c > -1; --c) {
													e[b--] = e[h--] + e[i + d] >> 1;
													d = --d & 31
												}
											}
											this.mix2Ctr--
										}
										if (this.doFilter) {
											d = this.mix1Pos + 32;
											e[d] = ~e[d] + 1
										}
										l = this.voices[0];
										while (l) {
											a = l.channel;
											if (l.waitCtr == 1) {
												l.waitCtr++
											} else if (l.waitCtr == 2) {
												l.waitCtr++;
												a.pointer = l.samplePtr;
												a.length = l.sampleLen
											}
											l = l.next
										}
									}
								}
							});
			h.voices[0] = a(0);
			h.voices[0].next = h.voices[1] = a(1);
			h.voices[1].next = h.voices[2] = a(2);
			h.voices[2].next = h.voices[3] = a(3);
			h.tracksPtr = new Uint32Array(4);
			return Object.seal(h)
		}
		var e = 4090, f = 4464, g = 4550, k = 4572, m = 4576, n = 4698, o = 5188, p = [
				1166, 408, 908 ], q = [ 0, 5760, 5424, 5120, 4832, 4560, 4304,
				4064, 3840, 3616, 3424, 3232, 3048, 2880, 2712, 2560, 2416,
				2280, 2152, 2032, 1920, 1808, 1712, 1616, 1524, 1440, 1356,
				1280, 1208, 1140, 1076, 1016, 960, 904, 856, 808, 762, 720,
				678, 640, 604, 570, 538, 508, 480, 452, 428, 404, 381, 360,
				339, 320, 302, 285, 269, 254, 240, 226, 214, 202, 190, 180,
				170, 160, 151, 143, 135, 127, 0, 0, 0, 0, 0, 0, 0, 4028, 3806,
				3584, 3394, 3204, 3013, 2855, 2696, 2538, 2395, 2268, 2141,
				2014, 1903, 1792, 1697, 1602, 1507, 1428, 1348, 1269, 1198,
				1134, 1071, 1007, 952, 896, 849, 801, 754, 714, 674, 635, 599,
				567, 536, 504, 476, 448, 425, 401, 377, 357, 337, 310, 300,
				284, 268, 252, 238, 224, 213, 201, 189, 179, 169, 159, 150,
				142, 134, 0, 0, 0, 0, 0, 0, 0, 3993, 3773, 3552, 3364, 3175,
				2987, 2830, 2672, 2515, 2374, 2248, 2122, 1997, 1887, 1776,
				1682, 1588, 1494, 1415, 1336, 1258, 1187, 1124, 1061, 999, 944,
				888, 841, 794, 747, 708, 668, 629, 594, 562, 531, 500, 472,
				444, 421, 397, 374, 354, 334, 315, 297, 281, 266, 250, 236,
				222, 211, 199, 187, 177, 167, 158, 149, 141, 133, 0, 0, 0, 0,
				0, 0, 0, 3957, 3739, 3521, 3334, 3147, 2960, 2804, 2648, 2493,
				2353, 2228, 2103, 1979, 1870, 1761, 1667, 1574, 1480, 1402,
				1324, 1247, 1177, 1114, 1052, 990, 935, 881, 834, 787, 740,
				701, 662, 624, 589, 557, 526, 495, 468, 441, 417, 394, 370,
				351, 331, 312, 295, 279, 263, 248, 234, 221, 209, 197, 185,
				176, 166, 156, 148, 140, 132, 0, 0, 0, 0, 0, 0, 0, 3921, 3705,
				3489, 3304, 3119, 2933, 2779, 2625, 2470, 2331, 2208, 2084,
				1961, 1853, 1745, 1652, 1560, 1467, 1390, 1313, 1235, 1166,
				1104, 1042, 981, 927, 873, 826, 780, 734, 695, 657, 618, 583,
				552, 521, 491, 464, 437, 413, 390, 367, 348, 329, 309, 292,
				276, 261, 246, 232, 219, 207, 195, 184, 174, 165, 155, 146,
				138, 131, 0, 0, 0, 0, 0, 0, 0, 3886, 3671, 3457, 3274, 3090,
				2907, 2754, 2601, 2448, 2310, 2188, 2065, 1943, 1836, 1729,
				1637, 1545, 1454, 1377, 1301, 1224, 1155, 1094, 1033, 972, 918,
				865, 819, 773, 727, 689, 651, 612, 578, 547, 517, 486, 459,
				433, 410, 387, 364, 345, 326, 306, 289, 274, 259, 243, 230,
				217, 205, 194, 182, 173, 163, 153, 145, 137, 130, 0, 0, 0, 0,
				0, 0, 0, 3851, 3638, 3426, 3244, 3062, 2880, 2729, 2577, 2426,
				2289, 2168, 2047, 1926, 1819, 1713, 1622, 1531, 1440, 1365,
				1289, 1213, 1145, 1084, 1024, 963, 910, 857, 811, 766, 720,
				683, 645, 607, 573, 542, 512, 482, 455, 429, 406, 383, 360,
				342, 323, 304, 287, 271, 256, 241, 228, 215, 203, 192, 180,
				171, 162, 152, 144, 136, 128, 6848, 6464, 6096, 5760, 5424,
				5120, 4832, 4560, 4304, 4064, 3840, 3616, 3424, 3232, 3048,
				2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1808, 1712,
				1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 904,
				856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 452,
				428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
				214, 202, 190, 180, 170, 160, 151, 143, 135, 127 ];
		window.neoart.S1Player = d
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				step : {
					value : null,
					writable : true
				},
				row : {
					value : null,
					writable : true
				},
				instr : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				pattern : {
					value : 0,
					writable : true
				},
				instrument : {
					value : 0,
					writable : true
				},
				note : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				original : {
					value : 0,
					writable : true
				},
				adsrPos : {
					value : 0,
					writable : true
				},
				sustainCtr : {
					value : 0,
					writable : true
				},
				pitchBend : {
					value : 0,
					writable : true
				},
				pitchBendCtr : {
					value : 0,
					writable : true
				},
				noteSlideTo : {
					value : 0,
					writable : true
				},
				noteSlideSpeed : {
					value : 0,
					writable : true
				},
				waveCtr : {
					value : 0,
					writable : true
				},
				wavePos : {
					value : 0,
					writable : true
				},
				arpeggioCtr : {
					value : 0,
					writable : true
				},
				arpeggioPos : {
					value : 0,
					writable : true
				},
				vibratoCtr : {
					value : 0,
					writable : true
				},
				vibratoPos : {
					value : 0,
					writable : true
				},
				speed : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.step = null;
						this.row = null;
						this.instr = null;
						this.sample = null;
						this.enabled = 0;
						this.pattern = 0;
						this.instrument = 0;
						this.note = 0;
						this.period = 0;
						this.volume = 0;
						this.original = 0;
						this.adsrPos = 0;
						this.sustainCtr = 0;
						this.pitchBend = 0;
						this.pitchBendCtr = 0;
						this.noteSlideTo = 0;
						this.noteSlideSpeed = 0;
						this.waveCtr = 0;
						this.wavePos = 0;
						this.arpeggioCtr = 0;
						this.arpeggioPos = 0;
						this.vibratoCtr = 0;
						this.vibratoPos = 0;
						this.speed = 0
					}
				}
			})
		}
		function b() {
			return Object.create(null, {
				wave : {
					value : 0,
					writable : true
				},
				waveLen : {
					value : 0,
					writable : true
				},
				waveDelay : {
					value : 0,
					writable : true
				},
				waveSpeed : {
					value : 0,
					writable : true
				},
				arpeggio : {
					value : 0,
					writable : true
				},
				arpeggioLen : {
					value : 0,
					writable : true
				},
				arpeggioDelay : {
					value : 0,
					writable : true
				},
				arpeggioSpeed : {
					value : 0,
					writable : true
				},
				vibrato : {
					value : 0,
					writable : true
				},
				vibratoLen : {
					value : 0,
					writable : true
				},
				vibratoDelay : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				pitchBend : {
					value : 0,
					writable : true
				},
				pitchBendDelay : {
					value : 0,
					writable : true
				},
				attackMax : {
					value : 0,
					writable : true
				},
				attackSpeed : {
					value : 0,
					writable : true
				},
				decayMin : {
					value : 0,
					writable : true
				},
				decaySpeed : {
					value : 0,
					writable : true
				},
				sustain : {
					value : 0,
					writable : true
				},
				releaseMin : {
					value : 0,
					writable : true
				},
				releaseSpeed : {
					value : 0,
					writable : true
				}
			})
		}
		function c() {
			var a = h();
			Object.defineProperties(a, {
				speed : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function d() {
			var a = i();
			Object.defineProperties(a, {
				negStart : {
					value : 0,
					writable : true
				},
				negLen : {
					value : 0,
					writable : true
				},
				negSpeed : {
					value : 0,
					writable : true
				},
				negDir : {
					value : 0,
					writable : true
				},
				negOffset : {
					value : 0,
					writable : true
				},
				negPos : {
					value : 0,
					writable : true
				},
				negCtr : {
					value : 0,
					writable : true
				},
				negToggle : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function e() {
			var a = j();
			Object.defineProperties(a, {
				soundTranspose : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function f(f) {
			var h = l(f);
			Object
					.defineProperties(
							h,
							{
								id : {
									value : "S2Player"
								},
								tracks : {
									value : [],
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								instruments : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								arpeggios : {
									value : null,
									writable : true
								},
								vibratos : {
									value : null,
									writable : true
								},
								waves : {
									value : null,
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								speedDef : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								patternLen : {
									value : 0,
									writable : true
								},
								arpeggioFx : {
									value : null,
									writable : true
								},
								arpeggioPos : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.speed = this.speedDef;
										this.tick = this.speedDef;
										this.trackPos = 0;
										this.patternPos = 0;
										this.patternLen = 64;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.instr = this.instruments[0];
											this.arpeggioFx[a.index] = 0;
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var f = 0, g = 0, h, i, j, k, l, m, n = 0, o, p, q, r, s;
										a.position = 58;
										h = a.readString(28);
										if (h != "SIDMON II - THE MIDI VERSION")
											return;
										a.position = 2;
										this.length = a.readUbyte();
										this.speedDef = a.readUbyte();
										this.samples.length = a.readUshort() >> 6;
										a.position = 14;
										k = a.readUint();
										this.tracks.length = k;
										a.position = 90;
										for (; g < k; ++g) {
											p = e();
											p.pattern = a.readUbyte();
											if (p.pattern > f)
												f = p.pattern;
											this.tracks[g] = p
										}
										for (g = 0; g < k; ++g) {
											p = this.tracks[g];
											p.transpose = a.readByte()
										}
										for (g = 0; g < k; ++g) {
											p = this.tracks[g];
											p.soundTranspose = a.readByte()
										}
										m = a.position;
										a.position = 26;
										k = a.readUint() >> 5;
										this.instruments.length = ++k;
										a.position = m;
										this.instruments[0] = b();
										for (g = 0; ++g < k;) {
											i = b();
											i.wave = a.readUbyte() << 4;
											i.waveLen = a.readUbyte();
											i.waveSpeed = a.readUbyte();
											i.waveDelay = a.readUbyte();
											i.arpeggio = a.readUbyte() << 4;
											i.arpeggioLen = a.readUbyte();
											i.arpeggioSpeed = a.readUbyte();
											i.arpeggioDelay = a.readUbyte();
											i.vibrato = a.readUbyte() << 4;
											i.vibratoLen = a.readUbyte();
											i.vibratoSpeed = a.readUbyte();
											i.vibratoDelay = a.readUbyte();
											i.pitchBend = a.readByte();
											i.pitchBendDelay = a.readUbyte();
											a.readByte();
											a.readByte();
											i.attackMax = a.readUbyte();
											i.attackSpeed = a.readUbyte();
											i.decayMin = a.readUbyte();
											i.decaySpeed = a.readUbyte();
											i.sustain = a.readUbyte();
											i.releaseMin = a.readUbyte();
											i.releaseSpeed = a.readUbyte();
											this.instruments[g] = i;
											a.position += 9
										}
										m = a.position;
										a.position = 30;
										k = a.readUint();
										this.waves = new Uint8Array(k);
										a.position = m;
										for (g = 0; g < k; ++g)
											this.waves[g] = a.readUbyte();
										m = a.position;
										a.position = 34;
										k = a.readUint();
										this.arpeggios = new Int8Array(k);
										a.position = m;
										for (g = 0; g < k; ++g)
											this.arpeggios[g] = a.readByte();
										m = a.position;
										a.position = 38;
										k = a.readUint();
										this.vibratos = new Int8Array(k);
										a.position = m;
										for (g = 0; g < k; ++g)
											this.vibratos[g] = a.readByte();
										k = this.samples.length;
										m = 0;
										for (g = 0; g < k; ++g) {
											q = d();
											a.readUint();
											q.length = a.readUshort() << 1;
											q.loop = a.readUshort() << 1;
											q.repeat = a.readUshort() << 1;
											q.negStart = m
													+ (a.readUshort() << 1);
											q.negLen = a.readUshort() << 1;
											q.negSpeed = a.readUshort();
											q.negDir = a.readUshort();
											q.negOffset = a.readShort();
											q.negPos = a.readUint();
											q.negCtr = a.readUshort();
											a.position += 6;
											q.name = a.readString(32);
											q.pointer = m;
											q.loopPtr = m + q.loop;
											m += q.length;
											this.samples[g] = q
										}
										r = m;
										k = ++f;
										l = new Uint16Array(++f);
										for (g = 0; g < k; ++g)
											l[g] = a.readUshort();
										m = a.position;
										a.position = 50;
										k = a.readUint();
										this.patterns = [];
										a.position = m;
										j = 1;
										for (g = 0; g < k; ++g) {
											o = c();
											s = a.readByte();
											if (!s) {
												o.effect = a.readByte();
												o.param = a.readUbyte();
												g += 2
											} else if (s < 0) {
												o.speed = ~s
											} else if (s < 112) {
												o.note = s;
												s = a.readByte();
												g++;
												if (s < 0) {
													o.speed = ~s
												} else if (s < 112) {
													o.sample = s;
													s = a.readByte();
													g++;
													if (s < 0) {
														o.speed = ~s
													} else {
														o.effect = s;
														o.param = a.readUbyte();
														g++
													}
												} else {
													o.effect = s;
													o.param = a.readUbyte();
													g++
												}
											} else {
												o.effect = s;
												o.param = a.readUbyte();
												g++
											}
											this.patterns[n++] = o;
											if (m + l[j] == a.position)
												l[j++] = n
										}
										l[j] = this.patterns.length;
										if ((a.position & 1) != 0)
											a.position++;
										this.mixer.store(a, r);
										k = this.tracks.length;
										for (g = 0; g < k; ++g) {
											p = this.tracks[g];
											p.pattern = l[p.pattern]
										}
										this.length++;
										this.version = 2
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, f = this.voices[0];
										this.arpeggioPos = ++this.arpeggioPos & 3;
										if (++this.tick >= this.speed) {
											this.tick = 0;
											while (f) {
												a = f.channel;
												f.enabled = f.note = 0;
												if (!this.patternPos) {
													f.step = this.tracks[this.trackPos
															+ f.index
															* this.length];
													f.pattern = f.step.pattern;
													f.speed = 0
												}
												if (--f.speed < 0) {
													f.row = c = this.patterns[f.pattern++];
													f.speed = c.speed;
													if (c.note) {
														f.enabled = 1;
														f.note = c.note
																+ f.step.transpose;
														a.enabled = 0
													}
												}
												f.pitchBend = 0;
												if (f.note) {
													f.waveCtr = f.sustainCtr = 0;
													f.arpeggioCtr = f.arpeggioPos = 0;
													f.vibratoCtr = f.vibratoPos = 0;
													f.pitchBendCtr = f.noteSlideSpeed = 0;
													f.adsrPos = 4;
													f.volume = 0;
													if (c.sample) {
														f.instrument = c.sample;
														f.instr = this.instruments[f.instrument
																+ f.step.soundTranspose];
														f.sample = this.samples[this.waves[f.instr.wave]]
													}
													f.original = f.note
															+ this.arpeggios[f.instr.arpeggio];
													a.period = f.period = g[f.original];
													d = f.sample;
													a.pointer = d.pointer;
													a.length = d.length;
													a.enabled = f.enabled;
													a.pointer = d.loopPtr;
													a.length = d.repeat
												}
												f = f.next
											}
											if (++this.patternPos == this.patternLen) {
												this.patternPos = 0;
												if (++this.trackPos == this.length) {
													this.trackPos = 0;
													this.mixer.complete = 1
												}
											}
										}
										f = this.voices[0];
										while (f) {
											if (!f.sample) {
												f = f.next;
												continue
											}
											a = f.channel;
											d = f.sample;
											if (d.negToggle) {
												f = f.next;
												continue
											}
											d.negToggle = 1;
											if (d.negCtr) {
												d.negCtr = --d.negCtr & 31
											} else {
												d.negCtr = d.negSpeed;
												if (!d.negDir) {
													f = f.next;
													continue
												}
												e = d.negStart + d.negPos;
												this.mixer.memory[e] = ~this.mixer.memory[e];
												d.negPos += d.negOffset;
												e = d.negLen - 1;
												if (d.negPos < 0) {
													if (d.negDir == 2) {
														d.negPos = e
													} else {
														d.negOffset = -d.negOffset;
														d.negPos += d.negOffset
													}
												} else if (e < d.negPos) {
													if (d.negDir == 1) {
														d.negPos = 0
													} else {
														d.negOffset = -d.negOffset;
														d.negPos += d.negOffset
													}
												}
											}
											f = f.next
										}
										f = this.voices[0];
										while (f) {
											if (!f.sample) {
												f = f.next;
												continue
											}
											f.sample.negToggle = 0;
											f = f.next
										}
										f = this.voices[0];
										while (f) {
											a = f.channel;
											b = f.instr;
											switch (f.adsrPos) {
											case 0:
												break;
											case 4:
												f.volume += b.attackSpeed;
												if (b.attackMax <= f.volume) {
													f.volume = b.attackMax;
													f.adsrPos--
												}
												break;
											case 3:
												if (!b.decaySpeed) {
													f.adsrPos--
												} else {
													f.volume -= b.decaySpeed;
													if (b.decayMin >= f.volume) {
														f.volume = b.decayMin;
														f.adsrPos--
													}
												}
												break;
											case 2:
												if (f.sustainCtr == b.sustain)
													f.adsrPos--;
												else
													f.sustainCtr++;
												break;
											case 1:
												f.volume -= b.releaseSpeed;
												if (b.releaseMin >= f.volume) {
													f.volume = b.releaseMin;
													f.adsrPos--
												}
												break
											}
											a.volume = f.volume >> 2;
											if (b.waveLen) {
												if (f.waveCtr == b.waveDelay) {
													f.waveCtr = b.waveDelay
															- b.waveSpeed;
													if (f.wavePos == b.waveLen)
														f.wavePos = 0;
													else
														f.wavePos++;
													f.sample = d = this.samples[this.waves[b.wave
															+ f.wavePos]];
													a.pointer = d.pointer;
													a.length = d.length
												} else
													f.waveCtr++
											}
											if (b.arpeggioLen) {
												if (f.arpeggioCtr == b.arpeggioDelay) {
													f.arpeggioCtr = b.arpeggioDelay
															- b.arpeggioSpeed;
													if (f.arpeggioPos == b.arpeggioLen)
														f.arpeggioPos = 0;
													else
														f.arpeggioPos++;
													e = f.original
															+ this.arpeggios[b.arpeggio
																	+ f.arpeggioPos];
													f.period = g[e]
												} else
													f.arpeggioCtr++
											}
											c = f.row;
											if (this.tick) {
												switch (c.effect) {
												case 0:
													break;
												case 112:
													this.arpeggioFx[0] = c.param >> 4;
													this.arpeggioFx[2] = c.param & 15;
													e = f.original
															+ this.arpeggioFx[this.arpeggioPos];
													f.period = g[e];
													break;
												case 113:
													f.pitchBend = ~c.param + 1;
													break;
												case 114:
													f.pitchBend = c.param;
													break;
												case 115:
													if (f.adsrPos != 0)
														break;
													if (f.instrument != 0)
														f.volume = b.attackMax;
													f.volume += c.param << 2;
													if (f.volume >= 256)
														f.volume = -1;
													break;
												case 116:
													if (f.adsrPos != 0)
														break;
													if (f.instrument != 0)
														f.volume = b.attackMax;
													f.volume -= c.param << 2;
													if (f.volume < 0)
														f.volume = 0;
													break
												}
											}
											switch (c.effect) {
											case 0:
												break;
											case 117:
												b.attackMax = c.param;
												b.attackSpeed = c.param;
												break;
											case 118:
												this.patternLen = c.param;
												break;
											case 124:
												a.volume = c.param;
												f.volume = c.param << 2;
												if (f.volume >= 255)
													f.volume = 255;
												break;
											case 127:
												e = c.param & 15;
												if (e)
													this.speed = e;
												break
											}
											if (b.vibratoLen) {
												if (f.vibratoCtr == b.vibratoDelay) {
													f.vibratoCtr = b.vibratoDelay
															- b.vibratoSpeed;
													if (f.vibratoPos == b.vibratoLen)
														f.vibratoPos = 0;
													else
														f.vibratoPos++;
													f.period += this.vibratos[b.vibrato
															+ f.vibratoPos]
												} else
													f.vibratoCtr++
											}
											if (b.pitchBend) {
												if (f.pitchBendCtr == b.pitchBendDelay) {
													f.pitchBend += b.pitchBend
												} else
													f.pitchBendCtr++
											}
											if (c.param) {
												if (c.effect && c.effect < 112) {
													f.noteSlideTo = g[c.effect
															+ f.step.transpose];
													e = c.param;
													if (f.noteSlideTo
															- f.period < 0)
														e = -e;
													f.noteSlideSpeed = e
												}
											}
											if (f.noteSlideTo
													&& f.noteSlideSpeed) {
												f.period += f.noteSlideSpeed;
												if (f.noteSlideSpeed < 0
														&& f.period < f.noteSlideTo
														|| f.noteSlideSpeed > 0
														&& f.period > f.noteSlideTo) {
													f.noteSlideSpeed = 0;
													f.period = f.noteSlideTo
												}
											}
											f.period += f.pitchBend;
											if (f.period < 95)
												f.period = 95;
											else if (f.period > 5760)
												f.period = 5760;
											a.period = f.period;
											f = f.next
										}
									}
								}
							});
			h.voices[0] = a(0);
			h.voices[0].next = h.voices[1] = a(1);
			h.voices[1].next = h.voices[2] = a(2);
			h.voices[2].next = h.voices[3] = a(3);
			h.arpeggioFx = new Uint8Array(4);
			return Object.seal(h)
		}
		var g = [ 0, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3616,
				3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032,
				1920, 1808, 1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140,
				1076, 1016, 960, 904, 856, 808, 762, 720, 678, 640, 604, 570,
				538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302, 285,
				269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143,
				135, 127, 120, 113, 107, 101, 95 ];
		window.neoart.S2Player = f
	})();
	(function() {
		function a(a) {
			return Object.create(null, {
				index : {
					value : a,
					writable : true
				},
				next : {
					value : null,
					writable : true
				},
				channel : {
					value : null,
					writable : true
				},
				sample : {
					value : null,
					writable : true
				},
				enabled : {
					value : 0,
					writable : true
				},
				period : {
					value : 0,
					writable : true
				},
				last : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				param : {
					value : 0,
					writable : true
				},
				initialize : {
					value : function() {
						this.channel = null;
						this.sample = null;
						this.enabled = 0;
						this.period = 0;
						this.last = 0;
						this.effect = 0;
						this.param = 0
					}
				}
			})
		}
		function b(b) {
			var j = l(b);
			Object
					.defineProperties(
							j,
							{
								id : {
									value : "STPlayer"
								},
								standard : {
									value : 0,
									writable : true
								},
								track : {
									value : null,
									writable : true
								},
								patterns : {
									value : [],
									writable : true
								},
								samples : {
									value : [],
									writable : true
								},
								length : {
									value : 0,
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								trackPos : {
									value : 0,
									writable : true
								},
								patternPos : {
									value : 0,
									writable : true
								},
								jumpFlag : {
									value : 0,
									writable : true
								},
								force : {
									set : function(a) {
										if (a < c)
											a = c;
										else if (a > f)
											a = f;
										this.version = a
									}
								},
								ntsc : {
									set : function(a) {
										this.standard = a;
										this.frequency(a);
										if (this.version < d) {
											a = a ? 20.44952532 : 20.637767904;
											a = a * (this.sampleRate / 1e3)
													/ 120;
											this.mixer.samplesTick = (240 - this.tempo)
													* a >> 0
										}
									}
								},
								initialize : {
									value : function() {
										var a = this.voices[0];
										this.reset();
										this.ntsc = this.standard;
										this.speed = 6;
										this.trackPos = 0;
										this.patternPos = 0;
										this.jumpFlag = 0;
										while (a) {
											a.initialize();
											a.channel = this.mixer.channels[a.index];
											a.sample = this.samples[0];
											a = a.next
										}
									}
								},
								loader : {
									value : function(a) {
										var b = 0, g, j, k, l, m = 0, n = 0, o;
										if (a.length < 1626)
											return;
										this.title = a.readString(20);
										m += this.isLegal(this.title);
										this.version = c;
										a.position = 42;
										for (g = 1; g < 16; ++g) {
											o = a.readUshort();
											if (!o) {
												this.samples[g] = null;
												a.position += 28;
												continue
											}
											l = i();
											a.position -= 24;
											l.name = a.readString(22);
											l.length = o << 1;
											a.position += 3;
											l.volume = a.readUbyte();
											l.loop = a.readUshort();
											l.repeat = a.readUshort() << 1;
											a.position += 22;
											l.pointer = n;
											n += l.length;
											this.samples[g] = l;
											m += this.isLegal(l.name);
											if (l.length > 9999)
												this.version = e
										}
										a.position = 470;
										this.length = a.readUbyte();
										this.tempo = a.readUbyte();
										for (g = 0; g < 128; ++g) {
											o = a.readUbyte() << 8;
											if (o > 16384)
												m--;
											this.track[g] = o;
											if (o > b)
												b = o
										}
										a.position = 600;
										b += 256;
										this.patterns.length = b;
										g = a.length - n - 600 >> 2;
										if (b > g)
											b = g;
										for (g = 0; g < b; ++g) {
											k = h();
											k.note = a.readUshort();
											o = a.readUbyte();
											k.param = a.readUbyte();
											k.effect = o & 15;
											k.sample = o >> 4;
											this.patterns[g] = k;
											if (k.effect > 2 && k.effect < 11)
												m--;
											if (k.note) {
												if (k.note < 113
														|| k.note > 856)
													m--
											}
											if (k.sample) {
												if (k.sample > 15
														|| !this.samples[k.sample]) {
													if (k.sample > 15)
														m--;
													k.sample = 0
												}
											}
											if (k.effect > 2 || !k.effect
													&& k.param != 0)
												this.version = d;
											if (k.effect == 11
													|| k.effect == 13)
												this.version = f
										}
										this.mixer.store(a, n);
										for (g = 1; g < 16; ++g) {
											l = this.samples[g];
											if (!l)
												continue;
											if (l.loop) {
												l.loopPtr = l.pointer + l.loop;
												l.pointer = l.loopPtr;
												l.length = l.repeat
											} else {
												l.loopPtr = this.mixer.memory.length;
												l.repeat = 2
											}
											n = l.pointer + 4;
											for (j = l.pointer; j < n; ++j)
												this.mixer.memory[j] = 0
										}
										l = i();
										l.pointer = l.loopPtr = this.mixer.memory.length;
										l.length = l.repeat = 2;
										this.samples[0] = l;
										if (m < 1)
											this.version = 0
									}
								},
								process : {
									value : function() {
										var a, b, d, e, g = this.voices[0];
										if (!this.tick) {
											e = this.track[this.trackPos]
													+ this.patternPos;
											while (g) {
												a = g.channel;
												g.enabled = 0;
												b = this.patterns[e + g.index];
												g.period = b.note;
												g.effect = b.effect;
												g.param = b.param;
												if (b.sample) {
													d = g.sample = this.samples[b.sample];
													if ((this.version & 2) == 2
															&& g.effect == 12)
														a.volume = g.param;
													else
														a.volume = d.volume
												} else {
													d = g.sample
												}
												if (g.period) {
													g.enabled = 1;
													a.enabled = 0;
													a.pointer = d.pointer;
													a.length = d.length;
													a.period = g.last = g.period
												}
												if (g.enabled)
													a.enabled = 1;
												a.pointer = d.loopPtr;
												a.length = d.repeat;
												if (this.version < f) {
													g = g.next;
													continue
												}
												switch (g.effect) {
												case 11:
													this.trackPos = g.param - 1;
													this.jumpFlag ^= 1;
													break;
												case 12:
													a.volume = g.param;
													break;
												case 13:
													this.jumpFlag ^= 1;
													break;
												case 14:
													this.mixer.filter.active = g.param ^ 1;
													break;
												case 15:
													if (!g.param)
														break;
													this.speed = g.param & 15;
													this.tick = 0;
													break
												}
												g = g.next
											}
										} else {
											while (g) {
												if (!g.param) {
													g = g.next;
													continue
												}
												a = g.channel;
												if (this.version == c) {
													if (g.effect == 1) {
														this.arpeggio(g)
													} else if (g.effect == 2) {
														e = g.param >> 4;
														if (e)
															g.period += e;
														else
															g.period -= g.param & 15;
														a.period = g.period
													}
												} else {
													switch (g.effect) {
													case 0:
														this.arpeggio(g);
														break;
													case 1:
														g.last -= g.param & 15;
														if (g.last < 113)
															g.last = 113;
														a.period = g.last;
														break;
													case 2:
														g.last += g.param & 15;
														if (g.last > 856)
															g.last = 856;
														a.period = g.last;
														break
													}
													if ((this.version & 2) != 2) {
														g = g.next;
														continue
													}
													switch (g.effect) {
													case 12:
														a.volume = g.param;
														break;
													case 13:
														this.mixer.filter.active = 0;
														break;
													case 14:
														this.speed = g.param & 15;
														break
													}
												}
												g = g.next
											}
										}
										if (++this.tick == this.speed) {
											this.tick = 0;
											this.patternPos += 4;
											if (this.patternPos == 256
													|| this.jumpFlag) {
												this.patternPos = this.jumpFlag = 0;
												if (++this.trackPos == this.length) {
													this.trackPos = 0;
													this.mixer.complete = 1
												}
											}
										}
									}
								},
								arpeggio : {
									value : function(a) {
										var b = a.channel, c = 0, d = this.tick % 3;
										if (!d) {
											b.period = a.last;
											return
										}
										if (d == 1)
											d = a.param >> 4;
										else
											d = a.param & 15;
										while (a.last != g[c])
											c++;
										b.period = g[c + d]
									}
								},
								isLegal : {
									value : function(a) {
										var b, c = 0, d = a.length;
										if (!d)
											return 0;
										for (; c < d; ++c) {
											b = a.charCodeAt(c);
											if (b && (b < 32 || b > 127))
												return 0
										}
										return 1
									}
								}
							});
			j.voices[0] = a(0);
			j.voices[0].next = j.voices[1] = a(1);
			j.voices[1].next = j.voices[2] = a(2);
			j.voices[2].next = j.voices[3] = a(3);
			j.track = new Uint16Array(128);
			return Object.seal(j)
		}
		var c = 1, d = 2, e = 3, f = 4, g = [ 856, 808, 762, 720, 678, 640,
				604, 570, 538, 508, 480, 453, 428, 404, 381, 360, 339, 320,
				302, 285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160,
				151, 143, 135, 127, 120, 113, 0, 0, 0 ];
		window.neoart.STPlayer = b
	})();
	(function() {
		function a(a) {
			var b = Object
					.create(
							null,
							{
								index : {
									value : a,
									writable : true
								},
								next : {
									value : null,
									writable : true
								},
								flags : {
									value : 0,
									writable : true
								},
								delay : {
									value : 0,
									writable : true
								},
								channel : {
									value : null,
									writable : true
								},
								patternLoop : {
									value : 0,
									writable : true
								},
								patternLoopRow : {
									value : 0,
									writable : true
								},
								playing : {
									value : null,
									writable : true
								},
								note : {
									value : 0,
									writable : true
								},
								keyoff : {
									value : 0,
									writable : true
								},
								period : {
									value : 0,
									writable : true
								},
								finetune : {
									value : 0,
									writable : true
								},
								arpDelta : {
									value : 0,
									writable : true
								},
								vibDelta : {
									value : 0,
									writable : true
								},
								instrument : {
									value : null,
									writable : true
								},
								autoVibratoPos : {
									value : 0,
									writable : true
								},
								autoSweep : {
									value : 0,
									writable : true
								},
								autoSweepPos : {
									value : 0,
									writable : true
								},
								sample : {
									value : null,
									writable : true
								},
								sampleOffset : {
									value : 0,
									writable : true
								},
								volume : {
									value : 0,
									writable : true
								},
								volEnabled : {
									value : 0,
									writable : true
								},
								volEnvelope : {
									value : null,
									writable : true
								},
								volDelta : {
									value : 0,
									writable : true
								},
								volSlide : {
									value : 0,
									writable : true
								},
								volSlideMaster : {
									value : 0,
									writable : true
								},
								fineSlideU : {
									value : 0,
									writable : true
								},
								fineSlideD : {
									value : 0,
									writable : true
								},
								fadeEnabled : {
									value : 0,
									writable : true
								},
								fadeDelta : {
									value : 0,
									writable : true
								},
								fadeVolume : {
									value : 0,
									writable : true
								},
								panning : {
									value : 0,
									writable : true
								},
								panEnabled : {
									value : 0,
									writable : true
								},
								panEnvelope : {
									value : null,
									writable : true
								},
								panSlide : {
									value : 0,
									writable : true
								},
								portaU : {
									value : 0,
									writable : true
								},
								portaD : {
									value : 0,
									writable : true
								},
								finePortaU : {
									value : 0,
									writable : true
								},
								finePortaD : {
									value : 0,
									writable : true
								},
								xtraPortaU : {
									value : 0,
									writable : true
								},
								xtraPortaD : {
									value : 0,
									writable : true
								},
								portaPeriod : {
									value : 0,
									writable : true
								},
								portaSpeed : {
									value : 0,
									writable : true
								},
								glissando : {
									value : 0,
									writable : true
								},
								glissPeriod : {
									value : 0,
									writable : true
								},
								vibratoPos : {
									value : 0,
									writable : true
								},
								vibratoSpeed : {
									value : 0,
									writable : true
								},
								vibratoDepth : {
									value : 0,
									writable : true
								},
								vibratoReset : {
									value : 0,
									writable : true
								},
								tremoloPos : {
									value : 0,
									writable : true
								},
								tremoloSpeed : {
									value : 0,
									writable : true
								},
								tremoloDepth : {
									value : 0,
									writable : true
								},
								waveControl : {
									value : 0,
									writable : true
								},
								tremorPos : {
									value : 0,
									writable : true
								},
								tremorOn : {
									value : 0,
									writable : true
								},
								tremorOff : {
									value : 0,
									writable : true
								},
								tremorVolume : {
									value : 0,
									writable : true
								},
								retrigx : {
									value : 0,
									writable : true
								},
								retrigy : {
									value : 0,
									writable : true
								},
								reset : {
									value : function() {
										this.volume = this.sample.volume;
										this.panning = this.sample.panning;
										this.finetune = this.sample.finetune >> 3 << 2;
										this.keyoff = 0;
										this.volDelta = 0;
										this.fadeEnabled = 0;
										this.fadeDelta = 0;
										this.fadeVolume = 65536;
										this.autoVibratoPos = 0;
										this.autoSweep = 1;
										this.autoSweepPos = 0;
										this.vibDelta = 0;
										this.vibratoReset = 0;
										if ((this.waveControl & 15) < 4)
											this.vibratoPos = 0;
										if (this.waveControl >> 4 < 4)
											this.tremoloPos = 0
									}
								},
								autoVibrato : {
									value : function() {
										var a;
										this.autoVibratoPos = this.autoVibratoPos
												+ this.playing.vibratoSpeed
												& 255;
										switch (this.playing.vibratoType) {
										case 0:
											a = x[this.autoVibratoPos];
											break;
										case 1:
											if (this.autoVibratoPos < 128)
												a = -64;
											else
												a = 64;
											break;
										case 2:
											a = (64 + (this.autoVibratoPos >> 1) & 127) - 64;
											break;
										case 3:
											a = (64 - (this.autoVibratoPos >> 1) & 127) - 64;
											break
										}
										a *= this.playing.vibratoDepth;
										if (this.autoSweep) {
											if (!this.playing.vibratoSweep) {
												this.autoSweep = 0
											} else {
												if (this.autoSweepPos > this.playing.vibratoSweep) {
													if (this.autoSweepPos & 2)
														a *= this.autoSweepPos
																/ this.playing.vibratoSweep;
													this.autoSweep = 0
												} else {
													a *= ++this.autoSweepPos
															/ this.playing.vibratoSweep
												}
											}
										}
										this.flags |= j;
										return a >> 6
									}
								},
								tonePortamento : {
									value : function() {
										if (!this.glissPeriod)
											this.glissPeriod = this.period;
										if (this.period < this.portaPeriod) {
											this.glissPeriod += this.portaSpeed << 2;
											if (!this.glissando)
												this.period = this.glissPeriod;
											else
												this.period = Math
														.round(this.glissPeriod / 64) << 6;
											if (this.period >= this.portaPeriod) {
												this.period = this.portaPeriod;
												this.glissPeriod = this.portaPeriod = 0
											}
										} else if (this.period > this.portaPeriod) {
											this.glissPeriod -= this.portaSpeed << 2;
											if (!this.glissando)
												this.period = this.glissPeriod;
											else
												this.period = Math
														.round(this.glissPeriod / 64) << 6;
											if (this.period <= this.portaPeriod) {
												this.period = this.portaPeriod;
												this.glissPeriod = this.portaPeriod = 0
											}
										}
										this.flags |= j
									}
								},
								tremolo : {
									value : function() {
										var a = 255, b = this.tremoloPos & 31;
										switch (this.waveControl >> 4 & 3) {
										case 0:
											a = y[b];
											break;
										case 1:
											a = b << 3;
											break
										}
										this.volDelta = a * this.tremoloDepth >> 6;
										if (this.tremoloPos > 31)
											this.volDelta = -this.volDelta;
										this.tremoloPos = this.tremoloPos
												+ this.tremoloSpeed & 63;
										this.flags |= k
									}
								},
								tremor : {
									value : function() {
										if (this.tremorPos == this.tremorOn) {
											this.tremorVolume = this.volume;
											this.volume = 0;
											this.flags |= k
										} else {
											this.tremorPos = 0;
											this.volume = this.tremorVolume;
											this.flags |= k
										}
										this.tremorPos++
									}
								},
								vibrato : {
									value : function() {
										var a = 255, b = this.vibratoPos & 31;
										switch (this.waveControl & 3) {
										case 0:
											a = y[b];
											break;
										case 1:
											a = b << 3;
											if (this.vibratoPos > 31)
												a = 255 - a;
											break
										}
										this.vibDelta = a * this.vibratoDepth >> 7;
										if (this.vibratoPos > 31)
											this.vibDelta = -this.vibDelta;
										this.vibratoPos = this.vibratoPos
												+ this.vibratoSpeed & 63;
										this.flags |= j
									}
								}
							});
			b.volEnvelope = c();
			b.panEnvelope = c();
			return Object.seal(b)
		}
		function b() {
			return Object.create(null, {
				points : {
					value : [],
					writable : true
				},
				total : {
					value : 0,
					writable : true
				},
				sustain : {
					value : 0,
					writable : true
				},
				loopStart : {
					value : 0,
					writable : true
				},
				loopEnd : {
					value : 0,
					writable : true
				},
				flags : {
					value : 0,
					writable : true
				}
			})
		}
		function c() {
			return Object.create(null, {
				value : {
					value : 0,
					writable : true
				},
				position : {
					value : 0,
					writable : true
				},
				frame : {
					value : 0,
					writable : true
				},
				delta : {
					value : 0,
					writable : true
				},
				fraction : {
					value : 0,
					writable : true
				},
				stopped : {
					value : 0,
					writable : true
				},
				reset : {
					value : function() {
						this.value = 0;
						this.position = 0;
						this.frame = 0;
						this.delta = 0;
						this.fraction = 0;
						this.stopped = 0
					}
				}
			})
		}
		function d() {
			var a = Object.create(null, {
				name : {
					value : "",
					writable : true
				},
				samples : {
					value : [],
					writable : true
				},
				noteSamples : {
					value : null,
					writable : true
				},
				fadeout : {
					value : 0,
					writable : true
				},
				volData : {
					value : null,
					writable : true
				},
				volEnabled : {
					value : 0,
					writable : true
				},
				panData : {
					value : null,
					writable : true
				},
				panEnabled : {
					value : 0,
					writable : true
				},
				vibratoType : {
					value : 0,
					writable : true
				},
				vibratoSweep : {
					value : 0,
					writable : true
				},
				vibratoSpeed : {
					value : 0,
					writable : true
				},
				vibratoDepth : {
					value : 0,
					writable : true
				}
			});
			a.noteSamples = new Uint8Array(96);
			a.volData = b();
			a.panData = b();
			return Object.seal(a)
		}
		function e(a, b) {
			var c = Object.create(null, {
				rows : {
					value : [],
					writable : true
				},
				length : {
					value : 0,
					writable : true
				},
				size : {
					value : 0,
					writable : true
				}
			});
			c.rows.length = c.size = a * b;
			c.length = a;
			return Object.seal(c)
		}
		function f(a, b) {
			var c = Object.create(null, {
				frame : {
					value : 0,
					writable : true
				},
				value : {
					value : 0,
					writable : true
				}
			});
			c.frame = a || 0;
			c.value = b || 0;
			return Object.seal(c)
		}
		function g() {
			return Object.create(null, {
				note : {
					value : 0,
					writable : true
				},
				instrument : {
					value : 0,
					writable : true
				},
				volume : {
					value : 0,
					writable : true
				},
				effect : {
					value : 0,
					writable : true
				},
				param : {
					value : 0,
					writable : true
				}
			})
		}
		function h() {
			var a = n();
			Object.defineProperties(a, {
				finetune : {
					value : 0,
					writable : true
				},
				panning : {
					value : 0,
					writable : true
				},
				relative : {
					value : 0,
					writable : true
				}
			});
			return Object.seal(a)
		}
		function i(c) {
			var i = p(c);
			Object
					.defineProperties(
							i,
							{
								id : {
									value : "F2Player"
								},
								patterns : {
									value : [],
									writable : true
								},
								instruments : {
									value : [],
									writable : true
								},
								voices : {
									value : [],
									writable : true
								},
								linear : {
									value : 0,
									writable : true
								},
								complete : {
									value : 0,
									writable : true
								},
								order : {
									value : 0,
									writable : true
								},
								position : {
									value : 0,
									writable : true
								},
								nextOrder : {
									value : 0,
									writable : true
								},
								nextPosition : {
									value : 0,
									writable : true
								},
								pattern : {
									value : null,
									writable : true
								},
								patternDelay : {
									value : 0,
									writable : true
								},
								patternOffset : {
									value : 0,
									writable : true
								},
								timer : {
									value : 0,
									writable : true
								},
								initialize : {
									value : function() {
										var b = 0, c;
										this.reset();
										this.timer = this.speed;
										this.order = 0;
										this.position = 0;
										this.nextOrder = -1;
										this.nextPosition = -1;
										this.patternDelay = 0;
										this.patternOffset = 0;
										this.complete = 0;
										this.master = 64;
										this.voices.length = this.channels;
										for (; b < this.channels; ++b) {
											c = a(b);
											c.channel = this.mixer.channels[b];
											c.playing = this.instruments[0];
											c.sample = c.playing.samples[0];
											this.voices[b] = c;
											if (b)
												this.voices[b - 1].next = c
										}
									}
								},
								loader : {
									value : function(a) {
										var c, i, j, k, l, m, n, o, p, q, s = 22, t, u, v, x;
										if (a.length < 360)
											return;
										a.position = 17;
										this.title = a.readString(20);
										a.position++;
										j = a.readString(20);
										if (j == "FastTracker v2.00   "
												|| j == "FastTracker v 2.00  ") {
											this.version = 1
										} else if (j == "Sk@le Tracker") {
											s = 2;
											this.version = 2
										} else if (j == "MadTracker 2.0") {
											this.version = 3
										} else if (j == "MilkyTracker        ") {
											this.version = 4
										} else if (j == "DigiBooster Pro 2.18") {
											this.version = 5
										} else if (j.indexOf("OpenMPT") != -1) {
											this.version = 6
										} else
											return;
										a.readUshort();
										c = a.readUint();
										this.length = a.readUshort();
										this.restart = a.readUshort();
										this.channels = a.readUshort();
										x = u = a.readUshort();
										this.instruments = [];
										this.instruments.length = a
												.readUshort() + 1;
										this.linear = a.readUshort();
										this.speed = a.readUshort();
										this.tempo = a.readUshort();
										this.track = new Uint8Array(this.length);
										for (i = 0; i < this.length; ++i) {
											n = a.readUbyte();
											if (n >= x)
												u = n + 1;
											this.track[i] = n
										}
										this.patterns = [];
										this.patterns.length = u;
										if (u != x) {
											p = e(64, this.channels);
											n = p.size;
											for (i = 0; i < n; ++i)
												p.rows[i] = g();
											this.patterns[--u] = p
										}
										a.position = q = c + 60;
										o = x;
										for (i = 0; i < o; ++i) {
											c = a.readUint();
											a.position++;
											p = e(a.readUshort(), this.channels);
											u = p.size;
											x = a.readUshort();
											a.position = q + c;
											m = a.position + x;
											if (x) {
												for (n = 0; n < u; ++n) {
													t = g();
													x = a.readUbyte();
													if (x & 128) {
														if (x & 1)
															t.note = a
																	.readUbyte();
														if (x & 2)
															t.instrument = a
																	.readUbyte();
														if (x & 4)
															t.volume = a
																	.readUbyte();
														if (x & 8)
															t.effect = a
																	.readUbyte();
														if (x & 16)
															t.param = a
																	.readUbyte()
													} else {
														t.note = x;
														t.instrument = a
																.readUbyte();
														t.volume = a
																.readUbyte();
														t.effect = a
																.readUbyte();
														t.param = a.readUbyte()
													}
													if (t.note != w)
														if (t.note > 96)
															t.note = 0;
													p.rows[n] = t
												}
											} else {
												for (n = 0; n < u; ++n)
													p.rows[n] = g()
											}
											this.patterns[i] = p;
											q = a.position;
											if (q != m)
												q = a.position = m
										}
										m = a.position;
										o = this.instruments.length;
										for (i = 1; i < o; ++i) {
											k = a.readUint();
											if (a.position + k >= a.length)
												break;
											l = d();
											l.name = a.readString(22);
											a.position++;
											x = a.readUshort();
											if (x > 16)
												x = 16;
											c = a.readUint();
											if (s == 2 && c != 64)
												c = 64;
											if (x) {
												l.samples = [];
												l.samples.length = x;
												for (n = 0; n < 96; ++n)
													l.noteSamples[n] = a
															.readUbyte();
												for (n = 0; n < 12; ++n)
													l.volData.points[n] = f(a
															.readUshort(), a
															.readUshort());
												for (n = 0; n < 12; ++n)
													l.panData.points[n] = f(a
															.readUshort(), a
															.readUshort());
												l.volData.total = a.readUbyte();
												l.panData.total = a.readUbyte();
												l.volData.sustain = a
														.readUbyte();
												l.volData.loopStart = a
														.readUbyte();
												l.volData.loopEnd = a
														.readUbyte();
												l.panData.sustain = a
														.readUbyte();
												l.panData.loopStart = a
														.readUbyte();
												l.panData.loopEnd = a
														.readUbyte();
												l.volData.flags = a.readUbyte();
												l.panData.flags = a.readUbyte();
												if (l.volData.flags & r)
													l.volEnabled = 1;
												if (l.panData.flags & r)
													l.panEnabled = 1;
												l.vibratoType = a.readUbyte();
												l.vibratoSweep = a.readUbyte();
												l.vibratoDepth = a.readUbyte();
												l.vibratoSpeed = a.readUbyte();
												l.fadeout = a.readUshort() << 1;
												a.position += s;
												q = a.position;
												this.instruments[i] = l;
												for (n = 0; n < x; ++n) {
													v = h();
													v.length = a.readUint();
													v.loopStart = a.readUint();
													v.loopLen = a.readUint();
													v.volume = a.readUbyte();
													v.finetune = a.readByte();
													v.loopMode = a.readUbyte();
													v.panning = a.readUbyte();
													v.relative = a.readByte();
													a.position++;
													v.name = a.readString(22);
													l.samples[n] = v;
													a.position = q += c
												}
												for (n = 0; n < x; ++n) {
													v = l.samples[n];
													if (!v.length)
														continue;
													q = a.position + v.length;
													if (v.loopMode & 16) {
														v.bits = 16;
														v.loopMode ^= 16;
														v.length >>= 1;
														v.loopStart >>= 1;
														v.loopLen >>= 1
													}
													if (!v.loopLen)
														v.loopMode = 0;
													v.store(a);
													if (v.loopMode)
														v.length = v.loopStart
																+ v.loopLen;
													a.position = q
												}
											} else {
												a.position = m + k
											}
											m = a.position;
											if (m >= a.length)
												break
										}
										l = d();
										l.volData = b();
										l.panData = b();
										l.samples = [];
										for (i = 0; i < 12; ++i) {
											l.volData.points[i] = f();
											l.panData.points[i] = f()
										}
										v = h();
										v.length = 220;
										v.data = new Float32Array(220);
										for (i = 0; i < 220; ++i)
											v.data[i] = 0;
										l.samples[0] = v;
										this.instruments[0] = l
									}
								},
								process : {
									value : function() {
										var a, b, c, d, e, f, g, h, i, n, p, r, s, x = this.voices[0];
										if (!this.tick) {
											if (this.nextOrder >= 0)
												this.order = this.nextOrder;
											if (this.nextPosition >= 0)
												this.position = this.nextPosition;
											this.nextOrder = this.nextPosition = -1;
											this.pattern = this.patterns[this.track[this.order]];
											while (x) {
												n = this.pattern.rows[this.position
														+ x.index];
												a = n.volume >> 4;
												i = n.effect == 3
														|| n.effect == 5
														|| a == 15;
												g = n.param >> 4;
												x.keyoff = 0;
												if (x.arpDelta) {
													x.arpDelta = 0;
													x.flags |= j
												}
												if (n.instrument) {
													x.instrument = n.instrument < this.instruments.length ? this.instruments[n.instrument]
															: null;
													x.volEnvelope.reset();
													x.panEnvelope.reset();
													x.flags |= k | l | q
												} else if (n.note == w
														|| n.effect == 20
														&& !n.param) {
													x.fadeEnabled = 1;
													x.keyoff = 1
												}
												if (n.note && n.note != w) {
													if (x.instrument) {
														c = x.instrument;
														s = n.note - 1;
														p = c.samples[c.noteSamples[s]];
														s += p.relative;
														if (s >= u && s <= v) {
															if (!i) {
																x.note = s;
																x.sample = p;
																if (n.instrument) {
																	x.volEnabled = c.volEnabled;
																	x.panEnabled = c.panEnabled;
																	x.flags |= o
																} else {
																	x.flags |= j
																			| m
																}
															}
															if (n.instrument) {
																x.reset();
																x.fadeDelta = c.fadeout
															} else {
																x.finetune = p.finetune >> 3 << 2
															}
															if (n.effect == 14
																	&& g == 5)
																x.finetune = (n.param & 15) - 8 << 3;
															if (this.linear) {
																s = (120 - s << 6)
																		- x.finetune
															} else {
																s = this
																		.amiga(
																				s,
																				x.finetune)
															}
															if (!i) {
																x.period = s;
																x.glissPeriod = 0
															} else {
																x.portaPeriod = s
															}
														}
													} else {
														x.volume = 0;
														x.flags = k | q
													}
												} else if (x.vibratoReset) {
													if (n.effect != 4
															&& n.effect != 6) {
														x.vibDelta = 0;
														x.vibratoReset = 0;
														x.flags |= j
													}
												}
												if (n.volume) {
													if (n.volume >= 16
															&& n.volume <= 80) {
														x.volume = n.volume - 16;
														x.flags |= k | q
													} else {
														h = n.volume & 15;
														switch (a) {
														case 6:
															x.volume -= h;
															if (x.volume < 0)
																x.volume = 0;
															x.flags |= k;
															break;
														case 7:
															x.volume += h;
															if (x.volume > 64)
																x.volume = 64;
															x.flags |= k;
															break;
														case 10:
															if (h)
																x.vibratoSpeed = h;
															break;
														case 11:
															if (h)
																x.vibratoDepth = h << 2;
															break;
														case 12:
															x.panning = h << 4;
															x.flags |= l;
															break;
														case 15:
															if (h)
																x.portaSpeed = h << 4;
															break
														}
													}
												}
												if (n.effect) {
													h = n.param & 15;
													switch (n.effect) {
													case 1:
														if (n.param)
															x.portaU = n.param << 2;
														break;
													case 2:
														if (n.param)
															x.portaD = n.param << 2;
														break;
													case 3:
														if (n.param && a != 15)
															x.portaSpeed = n.param;
														break;
													case 4:
														x.vibratoReset = 1;
														break;
													case 5:
														if (n.param)
															x.volSlide = n.param;
														break;
													case 6:
														if (n.param)
															x.volSlide = n.param;
														x.vibratoReset = 1;
														break;
													case 7:
														if (g)
															x.tremoloSpeed = g;
														if (h)
															x.tremoloDepth = h;
														break;
													case 8:
														x.panning = n.param;
														x.flags |= l;
														break;
													case 9:
														if (n.param)
															x.sampleOffset = n.param << 8;
														if (x.sampleOffset >= x.sample.length) {
															x.volume = 0;
															x.sampleOffset = 0;
															x.flags &= ~(j | m);
															x.flags |= k | q
														}
														break;
													case 10:
														if (n.param)
															x.volSlide = n.param;
														break;
													case 11:
														this.nextOrder = n.param;
														if (this.nextOrder >= this.length)
															this.complete = 1;
														else
															this.nextPosition = 0;
														e = 1;
														this.patternOffset = 0;
														break;
													case 12:
														x.volume = n.param;
														x.flags |= k | q;
														break;
													case 13:
														this.nextPosition = (g * 10 + h)
																* this.channels;
														this.patternOffset = 0;
														if (!e) {
															this.nextOrder = this.order + 1;
															if (this.nextOrder >= this.length) {
																this.complete = 1;
																this.nextPosition = -1
															}
														}
														break;
													case 14:
														switch (g) {
														case 1:
															if (h)
																x.finePortaU = h << 2;
															x.period -= x.finePortaU;
															x.flags |= j;
															break;
														case 2:
															if (h)
																x.finePortaD = h << 2;
															x.period += x.finePortaD;
															x.flags |= j;
															break;
														case 3:
															x.glissando = h;
															break;
														case 4:
															x.waveControl = x.waveControl
																	& 240 | h;
															break;
														case 6:
															if (!h) {
																x.patternLoopRow = this.patternOffset = this.position
															} else {
																if (!x.patternLoop) {
																	x.patternLoop = h
																} else {
																	x.patternLoop--
																}
																if (x.patternLoop)
																	this.nextPosition = x.patternLoopRow
															}
															break;
														case 7:
															x.waveControl = x.waveControl
																	& 15
																	| h << 4;
															break;
														case 10:
															if (h)
																x.fineSlideU = h;
															x.volume += x.fineSlideU;
															x.flags |= k;
															break;
														case 11:
															if (h)
																x.fineSlideD = h;
															x.volume -= x.fineSlideD;
															x.flags |= k;
															break;
														case 13:
															x.delay = x.flags;
															x.flags = 0;
															break;
														case 14:
															this.patternDelay = h
																	* this.timer;
															break
														}
														break;
													case 15:
														if (!n.param)
															break;
														if (n.param < 32)
															this.timer = n.param;
														else
															this.mixer.samplesTick = this.sampleRate
																	* 2.5
																	/ n.param >> 0;
														break;
													case 16:
														this.master = n.param;
														if (this.master > 64)
															this.master = 64;
														x.flags |= k;
														break;
													case 17:
														if (n.param)
															x.volSlideMaster = n.param;
														break;
													case 21:
														if (!x.instrument
																|| !x.instrument.volEnabled)
															break;
														c = x.instrument;
														s = n.param;
														g = c.volData.total;
														for (d = 0; d < g; d++)
															if (s < c.volData.points[d].frame)
																break;
														x.volEnvelope.position = --d;
														g--;
														if (c.volData.flags
																& t
																&& d == c.volData.loopEnd) {
															d = x.volEnvelope.position = c.volData.loopStart;
															s = c.volData.points[d].frame;
															x.volEnvelope.frame = s
														}
														if (d >= g) {
															x.volEnvelope.value = c.volData.points[g].value;
															x.volEnvelope.stopped = 1
														} else {
															x.volEnvelope.stopped = 0;
															x.volEnvelope.frame = s;
															if (s > c.volData.points[d].frame)
																x.volEnvelope.position++;
															b = c.volData.points[d];
															f = c.volData.points[++d];
															s = f.frame
																	- b.frame;
															x.volEnvelope.delta = (s ? (f.value
																	- b.value << 8)
																	/ s >> 0
																	: 0) || 0;
															x.volEnvelope.fraction = b.value << 8
														}
														break;
													case 24:
														if (n.param)
															x.panSlide = n.param;
														break;
													case 27:
														if (g)
															x.retrigx = g;
														if (h)
															x.retrigy = h;
														if (!n.volume
																&& x.retrigy) {
															a = this.tick + 1;
															if (a % x.retrigy)
																break;
															if (n.volume > 80
																	&& x.retrigx)
																this.retrig(x)
														}
														break;
													case 29:
														if (n.param) {
															x.tremorOn = ++g;
															x.tremorOff = ++h
																	+ g
														}
														break;
													case 33:
														if (g == 1) {
															if (h)
																x.xtraPortaU = h;
															x.period -= x.xtraPortaU;
															x.flags |= j
														} else if (g == 2) {
															if (h)
																x.xtraPortaD = h;
															x.period += x.xtraPortaD;
															x.flags |= j
														}
														break
													}
												}
												x = x.next
											}
										} else {
											while (x) {
												n = this.pattern.rows[this.position
														+ x.index];
												if (x.delay) {
													if ((n.param & 15) == this.tick) {
														x.flags = x.delay;
														x.delay = 0
													} else {
														x = x.next;
														continue
													}
												}
												if (n.volume) {
													g = n.volume >> 4;
													h = n.volume & 15;
													switch (g) {
													case 6:
														x.volume -= h;
														if (x.volume < 0)
															x.volume = 0;
														x.flags |= k;
														break;
													case 7:
														x.volume += h;
														if (x.volume > 64)
															x.volume = 64;
														x.flags |= k;
														break;
													case 11:
														x.vibrato();
														break;
													case 13:
														x.panning -= h;
														if (x.panning < 0)
															x.panning = 0;
														x.flags |= l;
														break;
													case 14:
														x.panning += h;
														if (x.panning > 255)
															x.panning = 255;
														x.flags |= l;
														break;
													case 15:
														if (x.portaPeriod)
															x.tonePortamento();
														break
													}
												}
												g = n.param >> 4;
												h = n.param & 15;
												switch (n.effect) {
												case 0:
													if (!n.param)
														break;
													s = (this.tick - this.timer) % 3;
													if (s < 0)
														s += 3;
													if (this.tick == 2
															&& this.timer == 18)
														s = 0;
													if (!s) {
														x.arpDelta = 0
													} else if (s == 1) {
														if (this.linear) {
															x.arpDelta = -(h << 6)
														} else {
															s = this.amiga(
																	x.note + h,
																	x.finetune);
															x.arpDelta = s
																	- x.period
														}
													} else {
														if (this.linear) {
															x.arpDelta = -(g << 6)
														} else {
															s = this.amiga(
																	x.note + g,
																	x.finetune);
															x.arpDelta = s
																	- x.period
														}
													}
													x.flags |= j;
													break;
												case 1:
													x.period -= x.portaU;
													if (x.period < 0)
														x.period = 0;
													x.flags |= j;
													break;
												case 2:
													x.period += x.portaD;
													if (x.period > 9212)
														x.period = 9212;
													x.flags |= j;
													break;
												case 3:
													if (x.portaPeriod)
														x.tonePortamento();
													break;
												case 4:
													if (g)
														x.vibratoSpeed = g;
													if (h)
														x.vibratoDepth = h << 2;
													x.vibrato();
													break;
												case 5:
													r = 1;
													if (x.portaPeriod)
														x.tonePortamento();
													break;
												case 6:
													r = 1;
													x.vibrato();
													break;
												case 7:
													x.tremolo();
													break;
												case 10:
													r = 1;
													break;
												case 14:
													switch (g) {
													case 9:
														if (this.tick % h == 0) {
															x.volEnvelope
																	.reset();
															x.panEnvelope
																	.reset();
															x.flags |= k | l
																	| m
														}
														break;
													case 12:
														if (this.tick == h) {
															x.volume = 0;
															x.flags |= k
														}
														break
													}
													break;
												case 17:
													g = x.volSlideMaster >> 4;
													h = x.volSlideMaster & 15;
													if (g) {
														this.master += g;
														if (this.master > 64)
															this.master = 64;
														x.flags |= k
													} else if (h) {
														this.master -= h;
														if (this.master < 0)
															this.master = 0;
														x.flags |= k
													}
													break;
												case 20:
													if (this.tick == n.param) {
														x.fadeEnabled = 1;
														x.keyoff = 1
													}
													break;
												case 24:
													g = x.panSlide >> 4;
													h = x.panSlide & 15;
													if (g) {
														x.panning += g;
														if (x.panning > 255)
															x.panning = 255;
														x.flags |= l
													} else if (h) {
														x.panning -= h;
														if (x.panning < 0)
															x.panning = 0;
														x.flags |= l
													}
													break;
												case 27:
													a = this.tick;
													if (!n.volume)
														a++;
													if (a % x.retrigy)
														break;
													if ((!n.volume || n.volume > 80)
															&& x.retrigx)
														this.retrig(x);
													x.flags |= m;
													break;
												case 29:
													x.tremor();
													break
												}
												if (r) {
													g = x.volSlide >> 4;
													h = x.volSlide & 15;
													r = 0;
													if (g) {
														x.volume += g;
														x.flags |= k
													} else if (h) {
														x.volume -= h;
														x.flags |= k
													}
												}
												x = x.next
											}
										}
										if (++this.tick >= this.timer
												+ this.patternDelay) {
											this.patternDelay = this.tick = 0;
											if (this.nextPosition < 0) {
												this.nextPosition = this.position
														+ this.channels;
												if (this.nextPosition >= this.pattern.size
														|| this.complete) {
													this.nextOrder = this.order + 1;
													this.nextPosition = this.patternOffset;
													if (this.nextOrder >= this.length) {
														this.nextOrder = this.restart;
														this.mixer.complete = 1
													}
												}
											}
										}
									}
								},
								fast : {
									value : function() {
										var a, b, c, d, e, f = this.voices[0], g;
										while (f) {
											a = f.channel;
											c = f.flags;
											f.flags = 0;
											if (c & m) {
												a.index = f.sampleOffset;
												a.pointer = -1;
												a.dir = 0;
												a.fraction = 0;
												a.sample = f.sample;
												a.length = f.sample.length;
												a.enabled = a.sample.data ? 1
														: 0;
												f.playing = f.instrument;
												f.sampleOffset = 0
											}
											d = f.playing;
											b = d.vibratoSpeed ? f
													.autoVibrato() : 0;
											g = f.volume + f.volDelta;
											if (d.volEnabled) {
												if (f.volEnabled
														&& !f.volEnvelope.stopped)
													this.envelope(f,
															f.volEnvelope,
															d.volData);
												g = g * f.volEnvelope.value >> 6;
												c |= k;
												if (f.fadeEnabled) {
													f.fadeVolume -= f.fadeDelta;
													if (f.fadeVolume < 0) {
														g = 0;
														f.fadeVolume = 0;
														f.fadeEnabled = 0;
														f.volEnvelope.value = 0;
														f.volEnvelope.stopped = 1;
														f.panEnvelope.stopped = 1
													} else {
														g = g * f.fadeVolume >> 16
													}
												}
											} else if (f.keyoff) {
												g = 0;
												c |= k
											}
											e = f.panning;
											if (d.panEnabled) {
												if (f.panEnabled
														&& !f.panEnvelope.stopped)
													this.envelope(f,
															f.panEnvelope,
															d.panData);
												e = f.panEnvelope.value << 2;
												c |= l;
												if (e < 0)
													e = 0;
												else if (e > 255)
													e = 255
											}
											if (c & k) {
												if (g < 0)
													g = 0;
												else if (g > 64)
													g = 64;
												a.volume = A[g * this.master >> 6];
												a.lvol = a.volume * a.lpan;
												a.rvol = a.volume * a.rpan
											}
											if (c & l) {
												a.panning = e;
												a.lpan = z[256 - e];
												a.rpan = z[e];
												a.lvol = a.volume * a.lpan;
												a.rvol = a.volume * a.rpan
											}
											if (c & j) {
												b += f.period + f.arpDelta
														+ f.vibDelta;
												if (this.linear) {
													a.speed = (548077568
															* Math
																	.pow(
																			2,
																			(4608 - b) / 768)
															/ this.sampleRate >> 0) / 65536
												} else {
													a.speed = (65536
															* (14317456 / b)
															/ this.sampleRate >> 0) / 65536
												}
												a.delta = a.speed >> 0;
												a.speed -= a.delta
											}
											f = f.next
										}
									}
								},
								accurate : {
									value : function() {
										var a, b, c, d, e, f, g, h, i, n = this.voices[0], o;
										while (n) {
											a = n.channel;
											c = n.flags;
											n.flags = 0;
											if (c & m) {
												if (a.sample) {
													c |= q;
													a.mixCounter = 220;
													a.oldSample = null;
													a.oldPointer = -1;
													if (a.enabled) {
														a.oldDir = a.dir;
														a.oldFraction = a.fraction;
														a.oldSpeed = a.speed;
														a.oldSample = a.sample;
														a.oldPointer = a.pointer;
														a.oldLength = a.length;
														a.lmixRampD = a.lvol;
														a.lmixDeltaD = a.lvol / 220;
														a.rmixRampD = a.rvol;
														a.rmixDeltaD = a.rvol / 220
													}
												}
												a.dir = 1;
												a.fraction = 0;
												a.sample = n.sample;
												a.pointer = n.sampleOffset;
												a.length = n.sample.length;
												a.enabled = a.sample.data ? 1
														: 0;
												n.playing = n.instrument;
												n.sampleOffset = 0
											}
											d = n.playing;
											b = d.vibratoSpeed ? n
													.autoVibrato() : 0;
											o = n.volume + n.volDelta;
											if (d.volEnabled) {
												if (n.volEnabled
														&& !n.volEnvelope.stopped)
													this.envelope(n,
															n.volEnvelope,
															d.volData);
												o = o * n.volEnvelope.value >> 6;
												c |= k;
												if (n.fadeEnabled) {
													n.fadeVolume -= n.fadeDelta;
													if (n.fadeVolume < 0) {
														o = 0;
														n.fadeVolume = 0;
														n.fadeEnabled = 0;
														n.volEnvelope.value = 0;
														n.volEnvelope.stopped = 1;
														n.panEnvelope.stopped = 1
													} else {
														o = o * n.fadeVolume >> 16
													}
												}
											} else if (n.keyoff) {
												o = 0;
												c |= k
											}
											g = n.panning;
											if (d.panEnabled) {
												if (n.panEnabled
														&& !n.panEnvelope.stopped)
													this.envelope(n,
															n.panEnvelope,
															d.panData);
												g = n.panEnvelope.value << 2;
												c |= l;
												if (g < 0)
													g = 0;
												else if (g > 255)
													g = 255
											}
											if (!a.enabled) {
												a.volCounter = 0;
												a.panCounter = 0;
												n = n.next;
												continue
											}
											if (c & k) {
												if (o < 0)
													o = 0;
												else if (o > 64)
													o = 64;
												o = A[o * this.master >> 6];
												f = o * z[256 - g];
												i = o * z[g];
												if (o != a.volume
														&& !a.mixCounter) {
													a.volCounter = c & q ? 220
															: this.mixer.samplesTick;
													a.lvolDelta = (f - a.lvol)
															/ a.volCounter;
													a.rvolDelta = (i - a.rvol)
															/ a.volCounter
												} else {
													a.lvol = f;
													a.rvol = i
												}
												a.volume = o
											}
											if (c & l) {
												e = z[256 - g];
												h = z[g];
												if (g != a.panning
														&& !a.mixCounter
														&& !a.volCounter) {
													a.panCounter = this.mixer.samplesTick;
													a.lpanDelta = (e - a.lpan)
															/ a.panCounter;
													a.rpanDelta = (h - a.rpan)
															/ a.panCounter
												} else {
													a.lpan = e;
													a.rpan = h
												}
												a.panning = g
											}
											if (c & j) {
												b += n.period + n.arpDelta
														+ n.vibDelta;
												if (this.linear) {
													a.speed = (548077568
															* Math
																	.pow(
																			2,
																			(4608 - b) / 768)
															/ this.sampleRate >> 0) / 65536
												} else {
													a.speed = (65536
															* (14317456 / b)
															/ this.sampleRate >> 0) / 65536
												}
											}
											if (a.mixCounter) {
												a.lmixRampU = 0;
												a.lmixDeltaU = a.lvol / 220;
												a.rmixRampU = 0;
												a.rmixDeltaU = a.rvol / 220
											}
											n = n.next
										}
									}
								},
								envelope : {
									value : function(a, b, c) {
										var d = b.position, e = c.points[d], f;
										if (b.frame == e.frame) {
											if (c.flags & t && d == c.loopEnd) {
												d = b.position = c.loopStart;
												e = c.points[d];
												b.frame = e.frame
											}
											if (d == c.total - 1) {
												b.value = e.value;
												b.stopped = 1;
												return
											}
											if (c.flags & s && d == c.sustain
													&& !a.fadeEnabled) {
												b.value = e.value;
												return
											}
											b.position++;
											f = c.points[b.position];
											b.delta = (f.value - e.value << 8)
													/ (f.frame - e.frame) >> 0 || 0;
											b.fraction = e.value << 8
										} else {
											b.fraction += b.delta
										}
										b.value = b.fraction >> 8;
										b.frame++
									}
								},
								amiga : {
									value : function(a, b) {
										var c = 0, d = B[++a];
										if (b < 0) {
											c = (B[--a] - d) / 64
										} else if (b > 0) {
											c = (d - B[++a]) / 64
										}
										return d - c * b >> 0
									}
								},
								retrig : {
									value : function(a) {
										switch (a.retrigx) {
										case 1:
											a.volume--;
											break;
										case 2:
											a.volume++;
											break;
										case 3:
											a.volume -= 4;
											break;
										case 4:
											a.volume -= 8;
											break;
										case 5:
											a.volume -= 16;
											break;
										case 6:
											a.volume = (a.volume << 1) / 3;
											break;
										case 7:
											a.volume >>= 1;
											break;
										case 8:
											a.volume = a.sample.volume;
											break;
										case 9:
											a.volume++;
											break;
										case 10:
											a.volume += 2;
											break;
										case 11:
											a.volume += 4;
											break;
										case 12:
											a.volume += 8;
											break;
										case 13:
											a.volume += 16;
											break;
										case 14:
											a.volume = a.volume * 3 >> 1;
											break;
										case 15:
											a.volume <<= 1;
											break
										}
										if (a.volume < 0)
											a.volume = 0;
										else if (a.volume > 64)
											a.volume = 64;
										a.flags |= k
									}
								}
							});
			return Object.seal(i)
		}
		var j = 1, k = 2, l = 4, m = 8, o = 15, q = 32, r = 1, s = 2, t = 4, u = 0, v = 118, w = 97, x = [
				0, -2, -3, -5, -6, -8, -9, -11, -12, -14, -16, -17, -19, -20,
				-22, -23, -24, -26, -27, -29, -30, -32, -33, -34, -36, -37,
				-38, -39, -41, -42, -43, -44, -45, -46, -47, -48, -49, -50,
				-51, -52, -53, -54, -55, -56, -56, -57, -58, -59, -59, -60,
				-60, -61, -61, -62, -62, -62, -63, -63, -63, -64, -64, -64,
				-64, -64, -64, -64, -64, -64, -64, -64, -63, -63, -63, -62,
				-62, -62, -61, -61, -60, -60, -59, -59, -58, -57, -56, -56,
				-55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44,
				-43, -42, -41, -39, -38, -37, -36, -34, -33, -32, -30, -29,
				-27, -26, -24, -23, -22, -20, -19, -17, -16, -14, -12, -11, -9,
				-8, -6, -5, -3, -2, 0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 16, 17,
				19, 20, 22, 23, 24, 26, 27, 29, 30, 32, 33, 34, 36, 37, 38, 39,
				41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
				56, 57, 58, 59, 59, 60, 60, 61, 61, 62, 62, 62, 63, 63, 63, 64,
				64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 63, 63, 63, 62, 62, 62,
				61, 61, 60, 60, 59, 59, 58, 57, 56, 56, 55, 54, 53, 52, 51, 50,
				49, 48, 47, 46, 45, 44, 43, 42, 41, 39, 38, 37, 36, 34, 33, 32,
				30, 29, 27, 26, 24, 23, 22, 20, 19, 17, 16, 14, 12, 11, 9, 8,
				6, 5, 3, 2 ], y = [ 0, 24, 49, 74, 97, 120, 141, 161, 180, 197,
				212, 224, 235, 244, 250, 253, 255, 253, 250, 244, 235, 224,
				212, 197, 180, 161, 141, 120, 97, 74, 49, 24 ], z = [ 0,
				.04417, .062489, .076523, .088371, .098821, .108239, .116927,
				.124977, .132572, .139741, .146576, .153077, .159335, .16535,
				.171152, .176772, .18221, .187496, .19263, .197643, .202503,
				.207273, .211951, .216477, .220943, .225348, .229631, .233854,
				.237985, .242056, .246066, .249985, .253873, .25767, .261437,
				.265144, .268819, .272404, .275989, .279482, .282976, .286409,
				.289781, .293153, .296464, .299714, .302965, .306185, .309344,
				.312473, .315602, .318671, .321708, .324746, .327754, .3307,
				.333647, .336563, .339449, .342305, .345161, .347986, .350781,
				.353545, .356279, .359013, .361717, .364421, .367094, .369737,
				.37238, .374992, .377574, .380157, .382708, .38526, .387782,
				.390303, .392794, .395285, .397746, .400176, .402606, .405037,
				.407437, .409836, .412206, .414576, .416915, .419254, .421563,
				.423841, .42618, .428458, .430737, .432985, .435263, .437481,
				.439729, .441916, .444134, .446321, .448508, .450665, .452852,
				.455009, .457136, .459262, .461389, .463485, .465611, .467708,
				.469773, .471839, .473935, .47597, .478036, .480072, .482077,
				.484112, .486117, .488122, .490127, .492101, .494106, .496051,
				.498025, .5, .501944, .503888, .505802, .507746, .50966,
				.511574, .513488, .515371, .517255, .519138, .521022, .522905,
				.524758, .526611, .528465, .530318, .53214, .533993, .535816,
				.537639, .539462, .541254, .543046, .544839, .546631, .548423,
				.550216, .551978, .553739, .555501, .557263, .558995, .560757,
				.562489, .56422, .565952, .567683, .569384, .571116, .572817,
				.574518, .57622, .57789, .579592, .581262, .582964, .584634,
				.586305, .587946, .589617, .591257, .592928, .594568, .596209,
				.597849, .599459, .6011, .60271, .60435, .60596, .60757,
				.60915, .61076, .61237, .61395, .61556, .617139, .618719,
				.620268, .621848, .623428, .624977, .626557, .628106, .629655,
				.631205, .632754, .634303, .635822, .637372, .63889, .64044,
				.641959, .643478, .644966, .646485, .648004, .649523, .651012,
				.6525, .653989, .655477, .656966, .658454, .659943, .661431,
				.66289, .664378, .665836, .667294, .668783, .670241, .671699,
				.673127, .674585, .676043, .677471, .678929, .680357, .681785,
				.683213, .684641, .686068, .687496, .688894, .690321, .691749,
				.693147, .694574, .695972, .697369, .698767, .700164, .701561,
				.702928, .704326, .705723, .70711 ], A = [ 0, .005863, .013701,
				.021569, .029406, .037244, .045082, .052919, .060757, .068625,
				.076463, .0843, .092138, .099976, .107844, .115681, .123519,
				.131357, .139194, .147032, .1549, .162738, .170575, .178413,
				.186251, .194119, .201956, .209794, .217632, .225469, .233307,
				.241175, .249013, .25685, .264688, .272526, .280394, .288231,
				.296069, .303907, .311744, .319582, .32745, .335288, .343125,
				.350963, .3588, .366669, .374506, .382344, .390182, .398019,
				.405857, .413725, .421563, .4294, .437238, .445076, .452944,
				.460781, .468619, .476457, .484294, .492132, .5 ], B = [ 29024,
				27392, 25856, 24384, 23040, 21696, 20480, 19328, 18240, 17216,
				16256, 15360, 14512, 13696, 12928, 12192, 11520, 10848, 10240,
				9664, 9120, 8608, 8128, 7680, 7256, 6848, 6464, 6096, 5760,
				5424, 5120, 4832, 4560, 4304, 4064, 3840, 3628, 3424, 3232,
				3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1814,
				1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016,
				960, 907, 856, 808, 762, 720, 678, 640, 604, 570, 538, 508,
				480, 453, 428, 404, 381, 360, 339, 320, 302, 285, 269, 254,
				240, 227, 214, 202, 190, 180, 169, 160, 151, 142, 134, 127,
				120, 113, 107, 101, 95, 90, 85, 80, 75, 71, 67, 63, 60, 57, 53,
				50, 48, 45, 42, 40, 38, 36, 34, 32, 30, 28 ];
		window.neoart.F2Player = i
	})()
})()
