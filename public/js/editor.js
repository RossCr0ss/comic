function postData(d) {
	$.ajax({
		url: '/data',
		type: 'POST',
		data: JSON.stringify(d),
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		success: function(data) {
			$('#hiddenId').val(data.id);
		}
	});

}

function putData(id, d) {
	$.ajax({
		url: '/data/' + id,
		type: 'PUT',
		data: JSON.stringify(d),
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		success: function(data) {
			$('#hiddenId').val(data.id);
		}
	});

}

function rgb2hex(rgb) {
	
	function hex(x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	}
	var r = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	var h = '#' + hex(r[1]) + hex(r[2]) + hex(r[3]);
	return h.toUpperCase();

}

/**
 * Saves the current comic. If this is a comic that has been loaded (i.e. one that
 * is already in the database) the existing comic is updated. If this is
 * a new comic, it is added to the database.
 * 
 * @param evt
 */
function doSave(evt) {

	var asNew = false;
	var existingId = $('#hiddenId').val();
	if (existingId === '') {
		asNew = true;
	}
	
	var cobj = buildComicOjbect();
	if (asNew) {
		postData(cobj);
	} else {
		putData(existingId, cobj);
	}

}

/**
 * Ignores the fact that this could be an existing comic and adds it to
 * the database with a new id.
 * 
 * @param evt
 */
function doSaveAsNew(evt) {

	var cobj = buildComicOjbect();
	postData(cobj);

}

/**
 * Constructs a cell object from a given DOM element
 * 
 * @param elem
 */
function buildCellObject(elem) {
	
	var sizerWidth = Number($('#sizer').css('width').replace(/\D/g, ''));
	var sizerHeight = Number($(elem).css('height').replace(/\D/g, ''));
	
	var bgc =$(elem).css('background-color');
	if (bgc.search("rgb") != -1) {
		bgc = rgb2hex(bgc);
	}
	
	var b = {
		background: bgc,
		bubbles: [],
		text: [],
		imgs: []
	};
	
	var zi = 1;
	
	$(elem).find("div.divimg, p.bubble, p.free-text").each(function(idx, elem) {
		
		// ====================================== SPEECH BUBBLES ===============
		if ($(elem).hasClass("bubble")) {
			
			var cssTop = $(elem).css('top');
			var cssLeft = $(elem).css('left');
			var cssWidth = $(elem).css('width');
			var sp = $(elem).hasClass('bubble25') ? 25 : ($(elem).hasClass('bubble75') ? 75 : 50);
			
			// positions need converted to %
			var t = Number(cssTop.replace('px', ''));
			var l = Number(cssLeft.replace('px', ''));
			var w = Number(cssWidth.replace('px', ''));
			t = t * (1 / sizerHeight) * 100;
			l = l * (1 / sizerWidth) * 100;
			w = w * (1 / sizerWidth) * 100;
			
			$(elem).find("span").each(function(idx, elem) {
				b.bubbles.push({
						top: t,
						left: l,
						width: w,
						z: zi++,
						stemPos: sp,
						text: $(elem).text()
				});
			});

		// ====================================== FREE TEXT ====================
		} else if ($(elem).hasClass("free-text")) {
			
			var cssTop = $(elem).css('top');
			var cssLeft = $(elem).css('left');
			var cssWidth = $(elem).css('width');
			
			// positions need converted to %
			var t = Number(cssTop.replace('px', ''));
			var l = Number(cssLeft.replace('px', ''));
			var w = Number(cssWidth.replace('px', ''));
			t = t * (1 / sizerHeight) * 100;
			l = l * (1 / sizerWidth) * 100;
			w = w * (1 / sizerWidth) * 100;
			
			$(elem).find("span").each(function(idx, elem) {
				b.text.push({
						top: t,
						left: l,
						width: w,
						z: zi++,
						words: $(elem).text()
				});
			});
			
		// ====================================== IMAGES =======================
		} else if ($(elem).hasClass("divimg")) {
			
			// sometimes, the style for 'top' and 'left' comes back as 'auto'...
			// in these cases, we should treat these values as 0
			var draggableTop  = isNaN($(elem).css('top').replace('px', '')) ? 0 : Number($(elem).css('top').replace('px', ''));
			var draggableLeft = isNaN($(elem).css('left').replace('px', '')) ? 0 : Number($(elem).css('left').replace('px', ''));
			
			$(elem).find("div.ui-wrapper").each(function(idx, elem) {

				var wrapperTop = Number($(elem).css('top').replace('px', ''));
				var wrapperLeft = Number($(elem).css('left').replace('px', ''));

				// why am I doing this? because when the image was created, it was
				// given a top and left value. making it draggable and resizable sets
				// relative positioning on the ui-draggable (divimg) div and absolute
				// positioning on the ui-wrapper div. to get the actual location of
				// the image, we have to add those 2 values together. the values on
				// the ui-wrapper div don't change, but the values on ui-draggable might.
				var t = draggableTop + wrapperTop;
				var l = draggableLeft + wrapperLeft;
				
				// positions need converted to %
				t = t * (1 / sizerHeight) * 100;
				l = l * (1 / sizerWidth) * 100;
				
				// width needs converted to %
				var cssWidth = $(elem).css('width');
				var w = Number(cssWidth.replace('px', ''));
				w = w * (1 / sizerWidth) * 100;
				
				$(elem).find("img").each(function(idx, elem) {
					var s = elem.src;
					s = s.substring(s.lastIndexOf('/')+1);
					b.imgs.push({
						top: t,
						left: l,
						width: w,
						z: zi++,
						src: s
					});
				});
			});
			
		}
		
	});
	
	return b;
	
}

function buildComicOjbect() {
	
	var sizerWidth = Number($('#sizer').css('width').replace(/\D/g, ''));
	
	var ct = $('#ctitle').val();
	var pd = $('#pubDate').val();
	
	var cobj = {
		pubDate: pd,
		title: ct,
		cells: []
	};
	
	$('#sizer div.box').each(function(idx, elem) {
		
		var b = buildCellObject(elem);
		cobj.cells.push(b);
		
	});
	
	return cobj;

}

function addImage(cell, img) {

	getImageAttributes(img.src, function(err, imgSize) {

		if (!err) {

			var sizerWidth = Number($('#sizer').css('width').replace('px', ''));
			var sizerHeight = Number($(cell).css('height').replace('px', ''));

			var d = document.createElement('div');
			var i = document.createElement('img');
			
			var aspectRatio = imgSize.width / imgSize.height;

			var w = (img.width / 100) * sizerWidth;
			var h = w / aspectRatio;

			var l = (img.left / 100) * sizerWidth; 
			var t = (img.top / 100) * sizerHeight;

			$(i).css('height', h + 'px');
			$(i).css('width', w + 'px');
			$(i).css('top', t + 'px');
			$(i).css('left', l + 'px');
			$(i).attr('src', '/images/' + img.src);
			$(i).attr('aspectRatio', aspectRatio);

			$(d).addClass('divimg');
			$(d).append(i);

			// see http://stackoverflow.com/questions/4948582/jquery-draggable-and-resizable
			$(cell).append(d);

			$(d).draggable();
			$(i).resizable({aspectRatio: true});

		}

	});
	
}

function addBubble(cell, b) {

	var bub = b || {};
	var stemPos = bub.stemPos || '50';
	var txt = bub.text || 'What does the frog say?';
	var bLeft = bub.left || 5;
	var bTop = bub.top || 5;
	var bWidth = bub.width || 50;
	
	var sizerWidth = Number($('#sizer').css('width').replace(/\D/g, ''));
	var sizerHeight = Number($(cell).css('height').replace(/\D/g, ''));

	var w = (bWidth / 100) * sizerWidth;

	var l = (bLeft / 100) * sizerWidth; 
	var t = (bTop / 100) * sizerHeight;
	
	var p = document.createElement('p');
	var s = document.createElement('span');
	$(s).append(document.createTextNode(txt));
	
	$(p).css('top', t + 'px');
	$(p).css('left', l + 'px');
	$(p).css('width', w + 'px');
	$(p).css('position', 'absolute');
	
	$(p).addClass('bubble');
	$(p).addClass('bubble-text');
	$(p).addClass('bubble' + stemPos);
	$(p).append(s);
	
	$(p).dblclick(toggleStemPosition);
	
	$(cell).append(p);
	$(p).draggable().resizable();
	$(s).editable({
		type: 'text',
		mode: 'inline',
		success: function(response, newValue) {
			console.log(newValue);
		}
	});
	
}

function addText(cell, t) {

	var txt = t || {};
	var words = txt.words || 'This is some text.';
	var tLeft = txt.left || 5;
	var tTop = txt.top || 5;
	var tWidth = txt.width || 50;
	
	var sizerWidth = Number($('#sizer').css('width').replace(/\D/g, ''));
	var sizerHeight = Number($(cell).css('height').replace(/\D/g, ''));

	var w = (tWidth / 100) * sizerWidth;

	var l = (tLeft / 100) * sizerWidth; 
	var t = (tTop / 100) * sizerHeight;
	
	var p = document.createElement('p');
	var s = document.createElement('span');
	$(s).append(document.createTextNode(words));
	
	$(p).css('top', t + 'px');
	$(p).css('left', l + 'px');
	$(p).css('width', w + 'px');
	$(p).css('position', 'absolute');
	
	$(p).addClass('free-text');
	$(p).addClass('free-text-outline');
	$(p).append(s);
	
	$(cell).append(p);
	$(p).draggable().resizable();
	$(s).editable({
		type: 'text',
		mode: 'inline',
		success: function(response, newValue) {
			console.log(newValue);
		}
	});
	
}


function addCell(c) {

	var d = document.createElement('div');
	$(d).addClass('box');
	$('#sizer').append(d);
	
	if (c) {
		
		var stuff = [];
		
		$(d).css('background-color', c.background);
		$.each(c.imgs, function(idx, obj) {
			//addImage(d, obj);
			stuff.push({
				'type': 'image',
				'object': obj
			});
		});

		$.each(c.text, function(idx, obj) {
			//addImage(d, obj);
			stuff.push({
				'type': 'text',
				'object': obj
			});
		});

		if (c.bubble) {
			//addBubble(d, c.bubble);
			stuff.push({
				'type': 'bubble',
				'object': c.bubble
			});
		} else if (c.bubbles) {
			$.each(c.bubbles, function(idx, bub) {
				//addBubble(d, bub);
				stuff.push({
					'type': 'bubble',
					'object': bub
				});
			});
		}
		
		// sort stuff by z-index
		stuff.sort(function(a, b) {
			var za = a.object.z || 0;
			var zb = b.object.z || 0;
			return za - zb;
		});
		
		// now add to cell
		$.each(stuff, function(idx, s) {
			
			if (s.type === 'image') {
				addImage(d, s.object);
			} else if (s.type === 'text') {
				addText(d, s.object);
			} else if (s.type === 'bubble') {
				addBubble(d, s.object);
			}
			
		});

	}

}

function clear() {
	
	$('#hiddenId').val('');
	$('#ctitle').val('');
	$('#pubDate').val(moment().format('YYYY-MM-DD'));
	$('#sizer div.box').remove();
	
}

/**
 * Access a SVG on the server and extract the width and height from it.
 * If successful, the callback function will be invoked with one or two parameters.
 * The first parameter is the error encountered, or null if there was no error.
 * The second is an object containing width and height properties. 
 * 
 * @param image
 * @param cb function to be called when finished
 */
function getImageAttributes(image, cb) {
	
	$.ajax({
		url: '/images/' + image,
		type: 'GET',
		dataType: 'xml',
		async: false,
		success: function(data) {
			var w = data.rootElement.getAttribute('width');
			var h = data.rootElement.getAttribute('height');
			cb(null, {
				width: w,
				height: h
			});
		},
		error: function() {
			cb(new Error('could not get image attributes'));
		}
	});
	
	
}

function toggleStemPosition(obj) {
	
	var t = obj.target;
	if ($(t).hasClass('bubble50')) {
		$(t).removeClass('bubble50');
		$(t).addClass('bubble75');
	} else if ($(t).hasClass('bubble75')) {
		$(t).removeClass('bubble75');
		$(t).addClass('bubble25');
	} else if ($(t).hasClass('bubble25')) {
		$(t).removeClass('bubble25');
		$(t).addClass('bubble50');
	}
	
}

function setupMenu(imgSelectOptions) {
	
	$.contextMenu( 'destroy' );
	
	$.contextMenu({
		
		zIndex: 100,
		selector: '.box',
		items: {
			bgcolor: {
				name: 'Background',
				type: 'text',
				value: '#FFFFFF'
			},
			sep1: "----------",
			dupCell: {
				name: "Duplicate Cell",
				callback: function(key, options) {
					
					var copy = buildCellObject(options.$trigger);
					addCell(copy);
					
				}
			},
			sep2: "----------",
			pickImage: {
				name: "Select Image",
				type: 'select',
				options: imgSelectOptions
			},
			addImage: {
				name: "Add Image",
				callback: function(key, options) {
					
					var $this = this;
					var o = $.contextMenu.getInputValues(options, $this.data());
					var selectedImage = o.pickImage;
					
					if (selectedImage) {
						
						addImage(options.$trigger, {
							src: selectedImage,
							width: 25,
							top: 5,
							left: 5
						});

					}

				}
			},
			sep3: "----------",
			addBubble: {
				name: "Add Bubble",
				callback: function(key, options) {

					addBubble(options.$trigger);
					
				}
			},
			addBubble: {
				name: "Add Text",
				callback: function(key, options) {

					addText(options.$trigger);
					
				}
			}
			

		},
		events: {
			show: function(opt) {
				var $this = this;
				var bgc = $this.css('background-color');
				if (bgc.search("rgb") != -1) {
					bgc = rgb2hex(bgc);
				}
				var d = {
					bgcolor: bgc
				};
				$.contextMenu.setInputValues(opt, d);
			},
			hide: function(opt) {
				var $this = this;
				var o = $.contextMenu.getInputValues(opt, $this.data());
				var c = o.bgcolor;
				if (c.search(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) != -1) {
					console.log('good color: ' + c);
					$this.css('background-color', c.toUpperCase());
				}
			}
		}
		
	});

	
	$.contextMenu({
		
		zIndex: 100,
		selector: '.divimg',
		items: {
			width: {
				name: 'Width',
				type: 'text',
				value: ''
			},
			left: {
				name: 'Left',
				type: 'text',
				value: ''
			},
			top: {
				name: 'Top',
				type: 'text',
				value: ''
			},
			sep1: "----------",
			pickImage: {
				name: "Select Image",
				type: 'select',
				options: imgSelectOptions
			},
			addImage: {
				name: "Change Image",
				callback: function(key, options) {
					
					var $this = this;
					var o = $.contextMenu.getInputValues(options, $this.data());
					var selectedImage = o.pickImage;
					
					$(options.$trigger).find("img").each(function(idx, elem) {
						$(elem).attr('src', '/images/' + selectedImage);
					});
					
				}
			},
			sep2: "----------",
			moveBack: {
				name: "Move Back",
				callback: function(key, options) {
					var n = options.$trigger;
					n.insertBefore(n.prev());
				}
			},
			moveUp: {
				name: "Move Forward",
				callback: function(key, options) {
					var n = options.$trigger;
					n.insertAfter(n.next());
				}
			},
			sep3: "----------",
			addBubble: {
				name: "Delete",
				callback: function(key, options) {
					$(options.$trigger).detach();
				}
			}

		},
		events: {
			show: function(opt) {
				
				var $this = this;
				
				// sometimes, the style for 'top' and 'left' comes back as 'auto'...
				// in these cases, we should treat these values as 0
				var draggableTop  = isNaN($this.css('top').replace('px', '')) ? 0 : Number($this.css('top').replace('px', ''));
				var draggableLeft = isNaN($this.css('left').replace('px', '')) ? 0 : Number($this.css('left').replace('px', ''));

				var wrapper = $this.find("div.ui-wrapper");
				var wrapperTop = Number(wrapper.css('top').replace('px', ''));
				var wrapperLeft = Number(wrapper.css('left').replace('px', ''));

				var t = draggableTop + wrapperTop;
				var l = draggableLeft + wrapperLeft;

				var img = wrapper.find('img');
				var w = img.css('width');
				var isrc = img.attr('src');
				isrc = isrc.substring(isrc.lastIndexOf('/')+1);
				var d = {
					width: w,
					top: t + 'px',
					left: l + 'px',
					pickImage: isrc
				};
				$.contextMenu.setInputValues(opt, d);
				
			},
			hide: function(opt) {
				
				var $this = this;
				var o = $.contextMenu.getInputValues(opt, $this.data());

				var newTop = isNaN(o.top.replace('px', '')) ? 0 : Number(o.top.replace('px', ''));
				var newLeft = isNaN(o.left.replace('px', '')) ? 0 : Number(o.left.replace('px', ''));

				var wrapper = $this.find("div.ui-wrapper");
				var wrapperTop = Number(wrapper.css('top').replace('px', ''));
				var wrapperLeft = Number(wrapper.css('left').replace('px', ''));

				$this.css('top', (newTop - wrapperTop) + "px");
				$this.css('left', (newLeft - wrapperLeft) + "px");

				var img = $this.find('img');
				if (img.css('width') !== o.width) {
					img.resizable('destroy');
					var aspectRatio = Number(img.attr('aspectRatio'));
					var w = Number(o.width.replace('px', ''));
					img.css('width', w + "px");
					img.css('height', (w / aspectRatio) + "px");
					img.resizable({aspectRatio: true});
				}

			}
		}
		
	});

	$.contextMenu({
		
		zIndex: 100,
		selector: 'p.bubble, p.free-text',
		items: {
			width: {
				name: 'Width',
				type: 'text',
				value: ''
			},
			left: {
				name: 'Left',
				type: 'text',
				value: ''
			},
			top: {
				name: 'Top',
				type: 'text',
				value: ''
			},
			sep1: "----------",
			moveBack: {
				name: "Move Back",
				callback: function(key, options) {
					var n = options.$trigger;
					n.insertBefore(n.prev());
				}
			},
			moveUp: {
				name: "Move Forward",
				callback: function(key, options) {
					var n = options.$trigger;
					n.insertAfter(n.next());
				}
			},
			sep3: "----------",
			addBubble: {
				name: "Delete",
				callback: function(key, options) {
					$(options.$trigger).detach();
				}
			}

		},
		events: {
			show: function(opt) {
				var $this = this;
				var w = $this.css('width');
				var t = $this.css('top');
				var l = $this.css('left');
				var d = {
						width: w,
						top: t,
						left: l,
					};
				$.contextMenu.setInputValues(opt, d);
			},
			hide: function(opt) {
				var $this = this;
				var o = $.contextMenu.getInputValues(opt, $this.data());
				$this.css('top', o.top);
				$this.css('left', o.left);
				if ($this.css('width') !== o.width) {
					$this.resizable('destroy');
					$this.css('width', o.width);
					$this.resizable();
				}
			}
		}
		
	});

}

function toggleImgUpload() {
	
	$('#myModal').modal('toggle');
	
}

/**
 * Display a modal dialog with a list of the existing comics from which to select
 * a comic for editing.
 */
function showComicList() {
	
	$('#comicSelect').empty();
	$('#loadModal').modal('toggle');
	$.ajax({
		url: '/list',
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			$.each(data, function(idx, val) {
				var oval = val.id + " :: " + val.published + " :: " + val.title;
				$('#comicSelect').append($("<option></option>").attr("value", val.id).text(oval));
			});
		}
	});
	
}

function doLoad() {
	
	var id = $('#comicSelect').val();

	$.ajax({
		url: '/data/' + id,
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			
			clear();
			
			$('#loadModal').modal('toggle');
			
			var pd = moment(data.pubDate.substring(data.pubDate.indexOf(',') + 1), ['DD MMM YYYY' , 'D MMM YYYY']);
			
			$('#ctitle').val(data.title);
			$('#pubDate').val(pd.format('YYYY-MM-DD'));
			$('#hiddenId').val(data.id);

			$.each(data.cells, function(idx, c) {
				addCell(c);
			});
			
		}
	});
	
}

$(function() {
	
	$('#clearButton').click(clear);
	$('#addCellButton').click(addCell);
	$('#saveButton').click(doSave);
	$('#saveAsNewButton').click(doSaveAsNew);
	$('#addImageButton').click(toggleImgUpload);
	$('#loadButton').click(showComicList);
	$('#confirmLoadButton').click(doLoad);
	
});

$(function() {
	
	$('#imgUpload').iframePostForm({
		json: true,
		post: function() {
			console.log('starting upload');
		},
		complete: function(resp) {
			console.log(resp);
			$('#myModal').modal('toggle');
			buildMenu();
		}
	});
	
});

$(function() {
	
	$('#datePicker').datetimepicker({
		pickTime : false
	});
	
	$('#pubDate').val(moment().format('YYYY-MM-DD'));
	
});

function buildMenu() {
	
	$.ajax({
		url: '/images',
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			var sd = {};
			for (var i = 0; i < data.length; i++) {
				sd[data[i].filename]= data[i].filename;
			}
			setupMenu(sd);
		}
	});
	
}

$(function() {

	buildMenu();
	
});
