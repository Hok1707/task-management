import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Edit2, Check, FileText } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { Note } from '../../types';
import { format } from 'date-fns';

export function QuickNotesPanel() {
  const { isNotesPanelOpen, setNotesPanelOpen, notes, addNote } = useNotesStore();
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addNote(newNoteContent);
      setNewNoteContent('');
    }
  };

  return (
    <AnimatePresence>
      {isNotesPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
            onClick={() => setNotesPanelOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[100vw] sm:w-[400px] sm:max-w-[90vw] bg-app-panel border-l border-app-border z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-app-border bg-black/5 shrink-0">
              <div className="flex items-center gap-2 text-app-text">
                <FileText className="w-4 h-4 text-app-accent-text" />
                <h2 className="font-bold text-sm tracking-tight">Quick Notes</h2>
              </div>
              <button
                onClick={() => setNotesPanelOpen(false)}
                className="text-app-text-muted hover:text-app-text transition-colors p-2 rounded-md hover:bg-app-ui cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close notes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-app-border bg-app-base shrink-0">
              <div className="relative">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Paste a code snippet or reminder..."
                  className="w-full h-24 bg-black/5 border border-app-border rounded-lg p-3 text-xs font-mono text-app-text placeholder-app-text-muted outline-none focus:border-app-accent resize-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="absolute bottom-2.5 right-2.5 p-2 bg-app-accent text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-app-accent-hover transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Save Note (Cmd+Enter)"
                  aria-label="Save note"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notes.length === 0 ? (
                <div className="text-center text-app-text-muted text-xs mt-10">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No notes yet. Save your first snippet above.
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface NoteCardProps {
  key?: string;
  note: Note;
}

function NoteCard({ note }: NoteCardProps) {
  const { updateNote, deleteNote } = useNotesStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    if (editContent.trim()) {
      updateNote(note.id, editContent);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-black/5 border border-app-border rounded-xl overflow-hidden group hover:border-app-border-hover transition-colors"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-black/10 border-b border-app-border/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
          {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
        </span>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-app-text-muted hover:text-app-text cursor-pointer rounded hover:bg-app-ui min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Edit Note"
                aria-label="Edit note"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                className="p-1.5 text-app-text-muted hover:text-red-500 cursor-pointer rounded hover:bg-red-500/10 min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Delete Note"
                aria-label="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 text-emerald-500 hover:bg-emerald-500/20 rounded cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Save Changes"
                aria-label="Save changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditContent(note.content);
                  setIsEditing(false);
                }}
                className="p-1.5 text-red-500 hover:bg-red-500/20 rounded cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Cancel"
                aria-label="Cancel editing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="p-3">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[100px] bg-black/5 border border-app-border rounded p-2 text-xs font-mono text-app-text outline-none focus:border-app-accent resize-y"
            autoFocus
          />
        ) : (
          <pre className="text-xs font-mono text-app-text whitespace-pre-wrap break-words">
            {note.content}
          </pre>
        )}
      </div>
    </motion.div>
  );
}
