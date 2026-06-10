import { getVisit } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';

export function prefetchVisit(id: string): void {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.visits.detail(id),
    queryFn: () => getVisit(id),
  });
}
