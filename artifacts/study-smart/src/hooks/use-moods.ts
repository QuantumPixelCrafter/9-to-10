import { useQueryClient } from "@tanstack/react-query";
import {
  useListMoods,
  useCreateMood,
  getListMoodsQueryKey,
} from "@workspace/api-client-react";

export function useMoodsData() {
  return useListMoods();
}

export function useCreateMoodAction() {
  const queryClient = useQueryClient();
  return useCreateMood({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMoodsQueryKey() });
      },
    },
  });
}
