function find_virtual_window(MG, jsdom, callback) {
  if (MG.virtual_window) {
    callback(MG.virtual_window);
    return;
  }

  // inspired by: https://bl.ocks.org/tomgp/c99a699587b5c5465228
  jsdom.env({
    html: '',
    features: { QuerySelector: true },
    done: function(err, virtual_window) {
      if (err) {
        throw err;
      }
      MG.virtual_window = virtual_window;
      callback(virtual_window);
    }
  });
}

function use_virtual_element(fn, jsdom_instance) {
  var global_scope = typeof window === 'undefined' ? global : window;

  var jsdom = jsdom_instance || global_scope.jsdom;
  if (typeof jsdom === 'undefined') {
    (console.error || console.log)('jsdom could not be found.');
    return;
  }

  find_virtual_window(MG, jsdom, function(virtual_window) {
    var virtual_d3 = d3.select(virtual_window.document);
    var virtual_element_id = 'elem-' + MG.virtual_element_id++;
    virtual_d3.select('body').append('div').attr('id', virtual_element_id);

    var original_d3 = global_scope.d3;
    var original_window = global_scope.window;
    var original_document = global_scope.document;
    global_scope.d3 = virtual_d3;
    global_scope.window = virtual_window;
    global_scope.document = virtual_window.document;

    var target = '#' + virtual_element_id;
    function get_markup() {
      return virtual_d3.select(target).html();
    }
    function done() {
      virtual_d3.select(target).remove();
    }
    try {
      fn(target, get_markup, done);
    } catch(e) {
      (console.error || console.log)(e);
    }

    global_scope.d3 = original_d3;
    global_scope.window = original_window;
    global_scope.document = original_document;
  });
}

function find_virtual_window_sync(MG, jsdom) {
  if (MG.virtual_window) {
    return MG.virtual_window;
  }

  var doc = jsdom.jsdom({
    html: '',
    features: { QuerySelector: true }
  });
  var virtual_window = doc.defaultView;
  MG.virtual_window = virtual_window;
  return virtual_window;
}

function use_virtual_element_sync(fn, jsdom_instance) {
  var global_scope = typeof window === 'undefined' ? global : window;

  var jsdom = jsdom_instance || global_scope.jsdom;
  if (typeof jsdom === 'undefined') {
    throw 'jsdom could not be found.';
  }

  var virtual_window = find_virtual_window_sync(MG, jsdom);
  var virtual_d3 = d3.select(virtual_window.document);
  var virtual_element_id = 'elem-' + MG.virtual_element_id++;
  virtual_d3.select('body').append('div').attr('id', virtual_element_id);

  var original_d3 = global_scope.d3;
  var original_window = global_scope.window;
  var original_document = global_scope.document;
  global_scope.d3 = virtual_d3;
  global_scope.window = virtual_window;
  global_scope.document = virtual_window.document;

  var target = '#' + virtual_element_id;
  var error;
  try {
    fn(target);
  } catch(e) {
    error = e;
  }

  global_scope.d3 = original_d3;
  global_scope.window = original_window;
  global_scope.document = original_document;

  if (error) {
    throw error;
  }
  var markup = virtual_d3.select(target).html();
  virtual_d3.select(target).remove();
  return markup;
}

MG.virtual_element_id = 0;
MG.use_virtual_element = use_virtual_element;
MG.use_virtual_element_sync = use_virtual_element_sync;
