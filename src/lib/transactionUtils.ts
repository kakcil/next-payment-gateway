import { apiService } from '@/services/api';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

//handles cancel transaction
export const handleCancelTransaction = async (
  id: string, 
  router: AppRouterInstance, 
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setCancelDialogOpen: (open: boolean) => void,
  theme?: "dark" | "light"
) => {
  try {
    setLoading(true);
    setCancelDialogOpen(false); //closes cancel dialog
    
    const response = await apiService.cancelTransaction(id);
    
    if (response.error) {
      throw new Error(response.error || 'Transaction could not be cancelled');
    }

    //successful cancellation
    
    //redirects to cancel page
    router.push('/cancel');
  } catch (err) {
    setError('An error occurred while cancelling the transaction');
  } finally {
    setLoading(false);
  }
}; 