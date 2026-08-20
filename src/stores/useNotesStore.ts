import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface NotesState {
  notes: Note[];
  isNotesPanelOpen: boolean;
  setNotesPanelOpen: (isOpen: boolean) => void;
  addNote: (content: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      isNotesPanelOpen: false,
      setNotesPanelOpen: (isOpen) => set({ isNotesPanelOpen: isOpen }),
      addNote: (content) =>
        set((state) => ({
          notes: [
            {
              id: uuidv4(),
              content,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...state.notes,
          ],
        })),
      updateNote: (id, content) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, content, updatedAt: new Date().toISOString() }
              : note
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
    }),
    {
      name: 'notes-storage',
    }
  )
);
