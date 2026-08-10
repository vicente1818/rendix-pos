import { useState, useCallback } from "react";

const EMPTY_CLI = { nombre: "", tel: "", ig: "", ciudad: "", notas: "" };

export function useCart() {
  const [cart, setCart] = useState([]);
  const [descPct, setDescPct] = useState(0);
  const [canal, setCanal] = useState("Instagram");
  const [metodo, setMetodo] = useState("Transferencia");
  const [cli, setCli] = useState(EMPTY_CLI);

  const clearCart = useCallback(() => {
    setCart([]);
    setDescPct(0);
    setCli(EMPTY_CLI);
  }, []);

  return { cart, setCart, descPct, setDescPct, canal, setCanal, metodo, setMetodo, cli, setCli, clearCart };
}
