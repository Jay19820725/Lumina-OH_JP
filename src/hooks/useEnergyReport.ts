import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTest } from '../store/TestContext';
import { useLanguage } from '../i18n/LanguageContext';

export const useEnergyReport = (onReset: () => void) => {
  const { report, setReport } = useTest();
  const { language: currentLangCode, setLanguage } = useLanguage();
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [showWeavingDialog, setShowWeavingDialog] = useState(false);
  const [selectedShareThumbnail, setSelectedShareThumbnail] = useState<string | null>(report?.shareThumbnail || null);

  // Show dialog if AI analysis is not yet complete
  useEffect(() => {
    if (report && !report.isAiComplete && !isLoadingShared) {
      setShowWeavingDialog(true);
    }
  }, [report?.id, report?.isAiComplete, isLoadingShared]);

  // Determine which content to show based on current language
  const displayContent = useMemo(() => {
    if (!report) return null;
    
    // If the report has a language tag and it doesn't match current language,
    // we might want to show a hint, but for now we just return the report.
    // The user requested to "completely hide reports in other languages" in the timeline,
    // but for a direct view (like shared link), we show it.
    return report;
  }, [report?.id, report?.isAiComplete]);

  // Mark report as seen when fully loaded
  useEffect(() => {
    if (report?.id && report.isAiComplete) {
      localStorage.setItem('lastSeenReportId', report.id);
    }
  }, [report?.id, report?.isAiComplete]);

  // Handle shared report fetching
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/report/')) {
      const reportId = path.split('/').pop();
      if (reportId && (!report || report.id !== reportId)) {
        setIsLoadingShared(true);
        
        let retryCount = 0;
        const maxRetries = 5;

        const fetchReport = async () => {
          try {
            const res = await fetch(`/api/report/${reportId}`);
            const data = await res.json();
            
            if (data && !data.error) {
              setReport(data);
              
              // Switch language if report has a different language
              if (data.lang && data.lang !== currentLangCode) {
                setLanguage(data.lang as any);
              }

              if (!data.isAiComplete && retryCount < maxRetries) {
                retryCount++;
                setTimeout(fetchReport, 3000);
              } else {
                setIsLoadingShared(false);
              }
            } else {
              onReset();
              setIsLoadingShared(false);
            }
          } catch (err) {
            onReset();
            setIsLoadingShared(false);
          }
        };
        
        fetchReport();
      }
    }
  }, [setReport, report?.id, onReset]);

  const handleSelectThumbnail = useCallback(async (url: string) => {
    setSelectedShareThumbnail(url);
    if (report?.id) {
      try {
        const response = await fetch(`/api/reports/${report.id}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareThumbnail: url })
        });
        if (response.ok) {
          setReport({ ...report, shareThumbnail: url });
        }
      } catch (error) {
        console.error('Failed to update share thumbnail:', error);
      }
    }
  }, [report, setReport]);

  return {
    report,
    displayContent,
    isLoadingShared,
    showWeavingDialog,
    setShowWeavingDialog,
    selectedShareThumbnail,
    handleSelectThumbnail,
    isAiLoading: !report?.isAiComplete && !report?.todayTheme,
  };
};
