#include <Python.h>
#include <structmember.h>
#include <xdo.h>

/* Global state */
xdo_t *xd;
Display *dpy;
Window wdw;

/* Objects */
typedef struct {
    PyObject_HEAD;
    Window window;
} WindowObject;

/* Window method declarations */
static PyObject *WindowObject_new(PyTypeObject *type, PyObject *args, PyObject *kwds);
static int WindowObject_init(WindowObject *self, PyObject *args, PyObject *kwds);
static void WindowObject_dealloc(WindowObject *self);
static PyObject *WindowObject_get_size(WindowObject *self);
static PyObject *WindowObject_get_name(WindowObject *self);
static PyObject *WindowObject_mouse_move(WindowObject *self, PyObject *args, 
                                         PyObject *kwds);
static PyObject *WindowObject_mouse_down(WindowObject *self, PyObject *args, 
                                         PyObject *kwds);
static PyObject *WindowObject_mouse_up(WindowObject *self, PyObject *args, 
                                         PyObject *kwds);
static PyObject *WindowObject_click(WindowObject *self, PyObject *args, 
                                         PyObject *kwds);
static PyObject *WindowObject_mouse_move_ratio(WindowObject *self, PyObject *args,
                                               PyObject *kwds);

static PyMethodDef WindowObject_methods[] = {
    {"get_size", (PyCFunction)WindowObject_get_size, METH_NOARGS,
        "Returns the dimensions (w, h) of the window."},
    {"get_name", (PyCFunction)WindowObject_get_name, METH_NOARGS,
        "Returns the name/title of the window, if applicable."},
    {"mouse_move", (PyCFunction)WindowObject_mouse_move, METH_KEYWORDS,
        "Moves the mouse cursor relative to the window."},
    {"mouse_move_ratio", (PyCFunction)WindowObject_mouse_move_ratio, METH_KEYWORDS,
        "Moves the mouse cursor relative to the window, where 0,0 is the top "
        "left corner and 1.0, 1.0 is the bottom right corner."},
    {"mouse_down", (PyCFunction)WindowObject_mouse_down, METH_KEYWORDS,
        "Sends a mouse down event for the specified button."},
    {"mouse_up", (PyCFunction)WindowObject_mouse_up, METH_KEYWORDS,
        "Sends a mouse up event for the specified button."},
    {"click", (PyCFunction)WindowObject_click, METH_KEYWORDS,
        "Sends a click event for the specified button."},
    {NULL}
};

static PyMemberDef WindowObject_members[] = {
    {"window", T_ULONG, offsetof(WindowObject, window), 0, 
        "X window ID"},
    {NULL}
};


static PyTypeObject mouserver_WindowType = {
    PyObject_HEAD_INIT(NULL)
    0,                          /*ob_size*/
    "mouserver_ext.Window",     /*tp_name*/
    sizeof(WindowObject),       /*tp_basicsize*/
    0,                          /*tp_itemsize*/
    (destructor)WindowObject_dealloc,       /*tp_dealloc*/
    0,                          /*tp_print*/
    0,                          /*tp_getattr*/
    0,                          /*tp_setattr*/
    0,                          /*tp_compare*/
    0,                          /*tp_repr*/
    0,                          /*tp_as_number*/
    0,                          /*tp_as_sequence*/
    0,                          /*tp_as_mapping*/
    0,                          /*tp_hash */
    0,                          /*tp_call*/
    0,                          /*tp_str*/
    0,                          /*tp_getattro*/
    0,                          /*tp_setattro*/
    0,                          /*tp_as_buffer*/
    Py_TPFLAGS_DEFAULT,         /*tp_flags*/
    "Mouserver Window Object",  /* tp_doc */
    0,		                    /* tp_traverse */
    0,		                    /* tp_clear */
    0,		                    /* tp_richcompare */
    0,                          /* tp_weaklistoffset */
    0,                          /* tp_iter */
    0,                          /* tp_iternext */
    WindowObject_methods,       /* tp_methods */
    WindowObject_members,       /* tp_members */
    0,                          /* tp_getset */
    0,                          /* tp_base */
    0,                          /* tp_dict */
    0,                          /* tp_descr_get */
    0,                          /* tp_descr_set */
    0,                          /* tp_dictoffset */
    (initproc)WindowObject_init,/* tp_init */
    0,                          /* tp_alloc */
    WindowObject_new,           /* tp_new */
};

/* Module method declarations */
static PyObject *mouserver_grab_window(PyObject *self, PyObject *args);

static PyMethodDef MouserverMethods[] = {
    {"grab_window", mouserver_grab_window, METH_VARARGS},
    {NULL, NULL, 0, NULL}
};


/* Exceptions */
static PyObject *MouserverError;
static PyObject *MouserverXError;

static int x_error_handler(Display *disp, XErrorEvent *error) {
    char buf[256];
    XGetErrorText(disp, error->type, buf, sizeof(buf));
    PyErr_SetString(MouserverXError, buf);
    return 0;
}

/* Module Methods */
static PyObject *mouserver_grab_window(PyObject *self, PyObject *args) {
    Window w = 0;
    if(!PyArg_ParseTuple(args, "")) return NULL;
    int ret = xdo_select_window_with_click(xd, &w);
    PyObject *arglist = Py_BuildValue("(L)", w);
    PyObject *wdwobj = WindowObject_new(&mouserver_WindowType, arglist, NULL);
    WindowObject_init((WindowObject*)wdwobj, arglist, NULL);
    Py_DECREF(arglist);
    return wdwobj;//Py_BuildValue("i", wdw);
}

/* WindowObject methods */

static PyObject *WindowObject_new(PyTypeObject *type, PyObject *args, PyObject *kwds) {
    WindowObject *self;

    self = (WindowObject*)type->tp_alloc(type, 0);
    if(self != NULL) {
        self->window = 0;
    }

    return (PyObject*)self;
}

static int WindowObject_init(WindowObject *self, PyObject *args, PyObject *kwds) {
    static char *kwlist[] = {"window", NULL};
    unsigned long w = 0;
    if(!PyArg_ParseTupleAndKeywords(args, kwds, "|L", kwlist, &w))
        return -1;

    self->window = w;
    return 0;
}

static void WindowObject_dealloc(WindowObject *self) {
    self->ob_type->tp_free((PyObject*)self);
}

static PyObject *WindowObject_get_size(WindowObject *self) {
    unsigned int w, h;
    int ret = xdo_get_window_size(xd, self->window, &w, &h);
    if(ret != 0) {
        PyErr_SetString(MouserverError, "xdo_get_window_size failed");
        return NULL;
    }
    return Py_BuildValue("(II)", w, h);
}

static PyObject *WindowObject_get_name(WindowObject *self) {
    unsigned char *name;
    int length;
    int name_type;
    int ret = xdo_get_window_name(xd, self->window, &name, &length, &name_type);
    return Py_BuildValue("s", name);
}

static PyObject *WindowObject_mouse_move(WindowObject *self, PyObject *args, 
                                         PyObject *kwds) {
    unsigned int x = 0, y = 0;
    unsigned int w, h;
    static char *kwlist[] = {"x", "y", NULL};
    if(!PyArg_ParseTupleAndKeywords(args, kwds, "|II", kwlist, &x, &y))
        return NULL;
    int ret = xdo_get_window_size(xd, self->window, &w, &h);
    if(ret != 0) {
        PyErr_SetString(MouserverError, "Failed to get window bounds");
        return NULL;
    }
    if(x > w) x = w;
    if(y > h) y = h;
    xdo_move_mouse_relative_to_window(xd, self->window, x, y);
    return Py_None;
}

static PyObject *WindowObject_mouse_move_ratio(WindowObject *self, PyObject *args,
                                               PyObject *kwds) {
    float x = 0., y = 0.;
    unsigned int w, h;
    static char *kwlist[] = {"x", "y", NULL};
    if(!PyArg_ParseTupleAndKeywords(args, kwds, "|ff", kwlist, &x, &y))
        return NULL;
    int ret = xdo_get_window_size(xd, self->window, &w, &h);
    if(ret != 0) {
        PyErr_SetString(MouserverError, "Failed to get window bounds");
        return NULL;
    }
    if(x > 1.0) x = 1.0;
    if(y > 1.0) y = 1.0;
    if(x < 0.0) x = 0.0;
    if(y < 0.0) y = 0.0;
    xdo_move_mouse_relative_to_window(xd, self->window, 
        (unsigned int)roundf(x * w), (unsigned int)roundf(y * h));
    return Py_None;
}

static PyObject *WindowObject_mouse_down(WindowObject *self, PyObject *args,
                                         PyObject *kwds) {
    int button = 1;
    static char *kwlist[] = {"button", NULL};
    if(!PyArg_ParseTupleAndKeywords(args, kwds, "|i", kwlist, &button))
        return NULL;
    xdo_mouse_down(xd, CURRENTWINDOW, button);
    return Py_None;
}

static PyObject *WindowObject_mouse_up(WindowObject *self, PyObject *args,
                                         PyObject *kwds) {
    int button = 1;
    static char *kwlist[] = {"button", NULL};
    if(!PyArg_ParseTupleAndKeywords(args, kwds, "|i", kwlist, &button))
        return NULL;
    xdo_mouse_up(xd, CURRENTWINDOW, button);
    return Py_None;
}

static PyObject *WindowObject_click(WindowObject *self, PyObject *args,
                                         PyObject *kwds) {
    int button = 1;
    static char *kwlist[] = {"button", NULL};
    if(!PyArg_ParseTupleAndKeywords(args, kwds, "|i", kwlist, &button))
        return NULL;
    xdo_click_window(xd, CURRENTWINDOW, button);
    return Py_None;
}

/* Initialization */
PyMODINIT_FUNC initmouserver_ext(void) {
    /* Initialize module */
    PyObject *m;
    m = Py_InitModule("mouserver_ext", MouserverMethods);
    if(m==NULL) return;

    MouserverError = PyErr_NewException("mouserver_ext.Error", NULL, NULL);
    Py_INCREF(MouserverError);
    MouserverXError = PyErr_NewException("mouserver_ext.XError", MouserverError, NULL);
    PyModule_AddObject(m, "Error", MouserverError);
    PyModule_AddObject(m, "XError", MouserverXError);

    mouserver_WindowType.tp_new = PyType_GenericNew;
    if(PyType_Ready(&mouserver_WindowType) < 0)
        return;

    Py_INCREF(&mouserver_WindowType);
    PyModule_AddObject(m, "Window", (PyObject*)&mouserver_WindowType);

    /* Initialize libxdo */
    xd = xdo_new(NULL);
    if(!xd) {
        PyErr_SetString(MouserverError, "Failed to initialize libxdo");
        return;
    }

    dpy = XOpenDisplay(NULL);
    if(!dpy) {
        PyErr_SetString(MouserverError, "Failed to open display");
        return;
    }

    /* Set our own error handler so that X errors get raised as exceptions
     * instead of exiting out of everything */
    XSetErrorHandler(x_error_handler);
}

int main(int argc, char **argv) {
    Py_SetProgramName(argv[0]);
    Py_Initialize();
    initmouserver_ext();
}
