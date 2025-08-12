import { toast } from 'react-toastify';

type NotifyType = 'success' | 'error' | 'info' | 'warning';

// Bildirim seçenekleri için ortak bir arayüz
interface NotifyOptions {
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  autoClose?: number | false;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
}

const defaultOptions: NotifyOptions = {
  position: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const useNotify = () => {
  const notify = (message: string, type: NotifyType = 'info', options: NotifyOptions = {}) => {
    toast(message, { ...defaultOptions, ...options, type });
  };

  const success = (message: string, options?: NotifyOptions) => notify(message, 'success', options);
  const error = (message: string, options?: NotifyOptions) => notify(message, 'error', options);
  const info = (message: string, options?: NotifyOptions) => notify(message, 'info', options);
  const warning = (message: string, options?: NotifyOptions) => notify(message, 'warning', options);

  return { success, error, info, warning };
};