import { useState, useEffect, useCallback } from 'react';
import securityService, {
  SecurityScore,
  SecurityFeature,
  KeyVerification,
  ForensicLog,
} from '@/app/src/services/securityService';

export const useSecurityData = () => {
  const [score, setScore] = useState<SecurityScore>({
    overall: 0,
    encryption: 0,
    authentication: 0,
    integrity: 0,
  });
  const [features, setFeatures] = useState<SecurityFeature[]>([]);
  const [keys, setKeys] = useState<KeyVerification[]>([]);
  const [logs, setLogs] = useState<ForensicLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [scoreData, featuresData, keysData, logsData] = await Promise.all([
        securityService.getSecurityScore(),
        securityService.getSecurityFeatures(),
        securityService.getKeyVerifications(),
        securityService.getForensicLogs(50),
      ]);

      setScore(scoreData);
      setFeatures(featuresData);
      setKeys(keysData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load security data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyKey = useCallback(async (contactId: string) => {
    try {
      const result = await securityService.verifyKey(contactId);
      if (result.success) {
        // Reload keys after verification
        const updatedKeys = await securityService.getKeyVerifications();
        setKeys(updatedKeys);
      }
      return result;
    } catch (err) {
      console.error('Failed to verify key:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  return {
    score,
    features,
    keys,
    logs,
    loading,
    error,
    verifyKey,
    refreshData: loadSecurityData,
  };
};