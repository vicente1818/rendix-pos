import { useState, useEffect, useCallback, useRef } from 'react';

export function useMercadoPagoQR({
  posOrderId,
  totalAmount,
  items,
  onSuccess,
  onExpire,
  pollIntervalMs = 2000,
}) {
  const [status, setStatus] = useState('IDLE'); // IDLE | CREATING | AWAITING_PAYMENT | PAID | EXPIRED | ERROR
  const [qrData, setQrData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [timeLeftSec, setTimeLeftSec] = useState(300); // 5 mins

  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/checkout/mercadopago/status/${posOrderId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.success && data.status === 'PAID') {
        setStatus('PAID');
        stopPolling();
        stopCountdown();
        if (onSuccess) onSuccess();
      } else if (data.status === 'EXPIRED') {
        setStatus('EXPIRED');
        stopPolling();
        stopCountdown();
        if (onExpire) onExpire();
      }
    } catch (err) {
      console.warn('Polling error:', err);
    }
  }, [posOrderId, stopPolling, stopCountdown, onSuccess, onExpire]);

  const initiateQR = useCallback(async () => {
    setStatus('CREATING');
    setErrorMsg(null);
    try {
      // Simulate dynamic QR generation payload for Mercado Pago Orders API / POST /v1/orders
      const dummyQr = `https://mpago.la/pos_order_${posOrderId}_${Date.now()}`;
      setQrData(dummyQr);
      setStatus('AWAITING_PAYMENT');
      setTimeLeftSec(300);

      // Countdown
      stopCountdown();
      countdownTimerRef.current = setInterval(() => {
        setTimeLeftSec((prev) => {
          if (prev <= 1) {
            stopCountdown();
            stopPolling();
            setStatus('EXPIRED');
            if (onExpire) onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start status check polling
      stopPolling();
      pollTimerRef.current = setInterval(checkStatus, pollIntervalMs);
    } catch (err) {
      setStatus('ERROR');
      setErrorMsg(err.message || 'Error al conectar con Mercado Pago');
    }
  }, [posOrderId, pollIntervalMs, checkStatus, stopPolling, stopCountdown, onExpire]);

  const cancelPayment = useCallback(() => {
    stopPolling();
    stopCountdown();
    setStatus('IDLE');
  }, [stopPolling, stopCountdown]);

  const simulateSuccess = useCallback(() => {
    setStatus('PAID');
    stopPolling();
    stopCountdown();
    if (onSuccess) onSuccess();
  }, [stopPolling, stopCountdown, onSuccess]);

  useEffect(() => {
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, [stopPolling, stopCountdown]);

  return {
    status,
    qrData,
    errorMsg,
    timeLeftSec,
    initiateQR,
    cancelPayment,
    simulateSuccess
  };
}
