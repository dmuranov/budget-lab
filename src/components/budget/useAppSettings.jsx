import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useAppSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => base44.entities.AppSettings.list(),
    staleTime: 5 * 60 * 1000,
  });

  const getSetting = (key) => {
    const found = settings.find(s => s.key === key);
    return found?.value || null;
  };

  const setSetting = async (key, value) => {
    const found = settings.find(s => s.key === key);
    if (found) {
      await base44.entities.AppSettings.update(found.id, { value });
    } else {
      await base44.entities.AppSettings.create({ key, value });
    }
    queryClient.invalidateQueries({ queryKey: ["app-settings"] });
  };

  return { getSetting, setSetting, isLoading };
}