import { useState, useEffect, useCallback, useRef } from 'react';

export function useMercadoPagoQR({
  posOrderId,
  totalAmount,
  items,
  onSuccess,
  onExpire,
}) {
  const [status, setStatus] = useState('IDLE'); // IDLE | CREATING | AWAITING_PAYMENT | PAID | EXPIRED | ERROR
  const [qrData, setQrData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [timeLeftSec, setTimeLeftSec] = useState(300); // 5 mins

  const countdownTimerRef = useRef(null);

  const stopCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const initiateQR = useCallback(async () => {
    setStatus('CREATING');
    setErrorMsg(null);
    try {
      // Genera un identificador de referencia para mostrar en el QR/orden.
      // No hay backend propio: esta app no puede verificar pagos de forma automática,
      // por eso el flujo exige confirmación manual con nro. de operación (ver confirmManualPayment).
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
            setStatus('EXPIRED');
            if (onExpire) onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setStatus('ERROR');
      setErrorMsg(err.message || 'Error al conectar con Mercado Pago');
    }
  }, [posOrderId, stopCountdown, onExpire]);

  const cancelPayment = useCallback(() => {
    stopCountdown();
    setStatus('IDLE');
  }, [stopCountdown]);

  const confirmManualPayment = useCallback((operationRef) => {
    const ref = (operationRef || '').trim();
    if (!ref) return false;
    setStatus('PAID');
    stopCountdown();
    if (onSuccess) onSuccess(ref);
    return true;
  }, [stopCountdown, onSuccess]);

  useEffect(() => {
    return () => {
      stopCountdown();
    };
  }, [stopCountdown]);

  return {
    status,
    qrData,
    errorMsg,
    timeLeftSec,
    initiateQR,
    cancelPayment,
    confirmManualPayment
  };
}
