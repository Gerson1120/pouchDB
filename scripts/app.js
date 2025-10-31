// Esperar a que todo el DOM esté cargado para empezar
document.addEventListener('DOMContentLoaded', () => {

    // Inicializar base de datos PouchDB
    const db = new PouchDB('tareas');

    // Elementos del DOM
    const taskForm = document.getElementById('taskForm');
    const inputName = document.getElementById('nombre');
    const inputFecha = document.getElementById('fecha');
    const taskContainer = document.getElementById('taskList');

    // --- EVENT LISTENERS ---

    // Usamos el evento 'submit' del formulario
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que la página se recargue
        agregarTarea();
    });

    // --- FUNCIONES ---

    // Guardar tarea
    function agregarTarea() {
        const nombre = inputName.value.trim();
        const fecha = inputFecha.value;

        // La validación 'required' en el HTML ya se encarga de esto,
        // pero una doble validación no hace daño.
        if (!nombre || !fecha) {
            alert("Completa todos los campos");
            return;
        }

        const tarea = {
            _id: new Date().toISOString(),
            nombre,
            fecha
        };

        db.put(tarea)
            .then((result) => {
                console.log('✅ Tarea guardada', result);
                inputName.value = '';
                inputFecha.value = '';
                inputName.focus(); // Pone el foco de nuevo en el primer campo
                animarConfirmacion("✅ Tarea guardada");
                listarTareas(); // Refrescar la lista de tareas
            })
            .catch((err) => {
                console.log('❌ Error al guardar', err);
                animarConfirmacion("❌ Error al guardar", true);
            });
    }

    // Listar todas las tareas
    async function listarTareas() {
        try {
            const result = await db.allDocs({ include_docs: true, descending: true });
            
            // Limpiar contenedor antes de renderizar
            taskContainer.innerHTML = "";

            if (result.rows.length === 0) {
                taskContainer.innerHTML = "<p class='empty-message'>No hay tareas pendientes.</p>";
            } else {
                result.rows.forEach(row => {
                    const task = row.doc;
                    const card = document.createElement("div");
                    card.className = "card";

                    // Formatear fecha para mejor visualización
                    const formattedDate = new Date(task.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });

                    card.innerHTML = `
                        <div class="card-content">
                            <div class="card-title">${task.nombre}</div>
                            <div class="card-date">${formattedDate}</div>
                        </div>
                    `;
                    taskContainer.appendChild(card);
                    // Pequeño delay para la animación de entrada
                    setTimeout(() => card.classList.add("show"), 10);
                });
            }
        } catch (err) {
            console.log('❌ Error al listar tareas', err);
            taskContainer.innerHTML = "<p class='empty-message error'>No se pudieron cargar las tareas.</p>";
        }
    }

    // Toast de confirmación (mejorado para aceptar mensajes y estados de error)
    function animarConfirmacion(message, isError = false) {
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.className = `toast ${isError ? 'error' : ''}`;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            // Esperar a que termine la animación de salida para removerlo
            toast.addEventListener('transitionend', () => toast.remove());
        }, 2000);
    }

    // Cargar las tareas al iniciar la aplicación
    listarTareas();
});