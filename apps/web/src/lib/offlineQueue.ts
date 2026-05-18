type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
};

const QUEUE_KEY = "khyber_offline_queue";

export const getQueuedRequests = (): QueuedRequest[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const enqueueRequest = (url: string, method: string, data: any) => {
  if (typeof window === "undefined") return;
  const queue = getQueuedRequests();
  const newRequest: QueuedRequest = {
    id: Math.random().toString(36).substring(2, 9),
    url,
    method,
    data,
    timestamp: Date.now()
  };
  queue.push(newRequest);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  
  // Trigger custom event to notify listeners (like the OfflineBanner)
  window.dispatchEvent(new Event("offline_queue_changed"));
};

export const clearQueue = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new Event("offline_queue_changed"));
};

export const syncOfflineQueue = async (apiInstance: any) => {
  if (typeof window === "undefined") return;
  const queue = getQueuedRequests();
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} offline actions...`);
  const remainingQueue: QueuedRequest[] = [];

  for (const req of queue) {
    try {
      if (req.method.toLowerCase() === "post") {
        await apiInstance.post(req.url, req.data);
      } else if (req.method.toLowerCase() === "put") {
        await apiInstance.put(req.url, req.data);
      } else if (req.method.toLowerCase() === "delete") {
        await apiInstance.delete(req.url);
      }
    } catch (error) {
      console.error(`Failed to sync queued request: ${req.url}`, error);
      remainingQueue.push(req);
    }
  }

  if (remainingQueue.length === 0) {
    clearQueue();
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    window.dispatchEvent(new Event("offline_queue_changed"));
  }
};
