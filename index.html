async function enviarTicket() {
  const data = {
    nombre: document.querySelector("#fullName")?.value,
    correo: document.querySelector("#email")?.value,
    telefono: (document.querySelector("#phoneCode")?.value || "") + " " + (document.querySelector("#phone")?.value || ""),
    pais: document.querySelector("#country")?.value,
    pedido: document.querySelector("#orderNumber")?.value,
    producto: document.querySelector("#product")?.value,
    tipo: document.querySelector("#requestType")?.value,
    prioridad: document.querySelector("#priority")?.value,
    canal: document.querySelector("#preferredChannel")?.value,
    descripcion: document.querySelector("#details")?.value,
  };

  const res = await fetch("/api/ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (result.success) {
    alert("Ticket creado: " + result.ticketId);
  } else {
    alert(result.error || "Error al crear ticket");
  }
}
