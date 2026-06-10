"use client";
import { useEffect } from "react";
import { useFlutterwave, closePaymentModal, FlutterWaveTypes } from "flutterwave-react-v3";

export type FlutterwaveCallbackResponse = FlutterWaveTypes.FlutterWaveResponse;

interface Props {
  config: FlutterWaveTypes.FlutterwaveConfig;
  onSuccess: (response: FlutterwaveCallbackResponse) => void;
  onClose: () => void;
}

/**
 * Mounts only when a valid config is ready, then immediately opens the
 * Flutterwave inline popup. Parent controls mount/unmount via conditional render.
 */
export default function FlutterwavePayment({ config, onSuccess, onClose }: Props) {
  const handleFlutterPayment = useFlutterwave(config);

  useEffect(() => {
    handleFlutterPayment({
      callback: (response) => {
        closePaymentModal();
        onSuccess(response);
      },
      onClose,
    });
    // Intentionally runs once on mount — parent remounts when config changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
