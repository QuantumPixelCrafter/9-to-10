import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotes,
  useGetNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useGenerateQuiz,
  getListNotesQueryKey,
  getGetNoteQueryKey,
} from "@workspace/api-client-react";

export function useNotesData(subjectId?: number) {
  return useListNotes(subjectId ? { subjectId } : undefined);
}

export function useNoteData(id: number) {
  return useGetNote(id, { query: { enabled: !!id } });
}

export function useCreateNoteAction() {
  const queryClient = useQueryClient();
  return useCreateNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      },
    },
  });
}

export function useUpdateNoteAction() {
  const queryClient = useQueryClient();
  return useUpdateNote({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetNoteQueryKey(data.id) });
      },
    },
  });
}

export function useDeleteNoteAction() {
  const queryClient = useQueryClient();
  return useDeleteNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      },
    },
  });
}

export function useGenerateQuizAction() {
  return useGenerateQuiz();
}
