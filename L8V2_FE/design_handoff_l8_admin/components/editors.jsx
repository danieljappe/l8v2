// Three "create/edit" patterns wrapping EventForm: modal, drawer, full-page.
// All accept the same props and render their chrome around <EventForm>.

const { I, EventForm } = window;

function EditorHeader({ mode, title, onClose, pattern }) {
  return (
    <div className="fhead">
      <div className="fhead-l">
        <button className="btn btn-ghost btn-icon" onClick={onClose}><I name="x" /></button>
        <div>
          <div className="crumb">Events / {mode === 'edit' ? 'Edit' : 'New'}</div>
          <h3>{mode === 'edit' ? (title || 'Edit event') : 'New event'}</h3>
        </div>
      </div>
      <div className="fhead-r">
        <span className="kbd">Esc</span>
      </div>
    </div>
  );
}

function ModalEditor({ open, mode, initial, onSave, onCancel }) {
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
      <div className={`modal-shell ${open ? 'is-open' : ''}`}>
        <div className="modal-card">
          {open && (
            <>
              <EditorHeader mode={mode} title={initial?.title} onClose={onCancel} pattern="modal" />
              <EventForm
                initial={initial}
                mode={mode}
                layout="modal"
                onSave={onSave}
                onCancel={onCancel}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DrawerEditor({ open, mode, initial, onSave, onCancel }) {
  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={() => onCancel?.()} />
      <div className={`drawer-shell ${open ? 'is-open' : ''}`}>
        <div className="drawer-card">
          {open && (
            <>
              <EditorHeader mode={mode} title={initial?.title} onClose={onCancel} pattern="drawer" />
              <EventForm
                initial={initial}
                mode={mode}
                layout="drawer"
                onSave={onSave}
                onCancel={onCancel}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function FullPageEditor({ open, mode, initial, onSave, onCancel }) {
  return (
    <div className={`fp-shell ${open ? 'is-open' : ''}`}>
      {open && (
        <>
          <EditorHeader mode={mode} title={initial?.title} onClose={onCancel} pattern="fullpage" />
          <EventForm
            initial={initial}
            mode={mode}
            layout="fullpage"
            onSave={onSave}
            onCancel={onCancel}
          />
        </>
      )}
    </div>
  );
}

function Editor({ pattern, ...props }) {
  if (pattern === 'drawer') return <DrawerEditor {...props} />;
  if (pattern === 'fullpage') return <FullPageEditor {...props} />;
  return <ModalEditor {...props} />;
}

Object.assign(window, { Editor });
