import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await api.get('/categories');
    setCategories(data.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  return { categories, loading, reload };
}
