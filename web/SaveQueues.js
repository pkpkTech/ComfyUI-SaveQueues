import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
    name: "SaveQueues.MenuButton",
    async setup(app) {
        const menu = document.querySelector(".comfy-menu");
        const hr = document.createElement("hr");

        hr.style.margin = "8px 0";
        hr.style.width = "100%";
        menu.append(hr);

        const saveButton = document.createElement("button");
        saveButton.id = "saveQueuesButton"
        saveButton.textContent = "Save Queues";
        saveButton.onclick = async () => {
            const res = await api.fetchApi("/queue", { cache: "no-store" });
            const json = await res.json();
            const options = {
              suggestedName: "queues.json",
              types: [
                {
                  description: "JSON Files",
                  accept: {
                    "application/json": [".json"],
                  },
                },
              ],
            };

            const handle = await window.showSaveFilePicker(options);
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(json));
            await writable.close();
        }
        menu.append(saveButton);


        const loadButton = document.createElement("button");
        loadButton.id = "loadQueuesButton";
        loadButton.textContent = "Load Queues";
        loadButton.onclick = () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.click();

            input.addEventListener("change", e => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = async () => {
                    const data = JSON.parse(reader.result);
                    if (data.queue_running == null && data.queue_pending == null) {
                        window.alert("no queues");
                        return;
                    }
                    if (Array.isArray(data.queue_running) && Array.isArray(data.queue_running[0])) {
                        await api.queuePrompt(0, {
                            output: data.queue_running[0][2],
                            workflow: data.queue_running[0][3]
                        });
                    }
                    if (Array.isArray(data.queue_pending)) {
                        for (const p of data.queue_pending.toSorted((a, b) => a[0] - b[0])) {
                            await api.queuePrompt(0, {
                                output: data.queue_running[0][2],
                                workflow: data.queue_running[0][3]
                            });
                        }
                    }
                }
                reader.readAsText(file);
            });
        }

        menu.append(loadButton);
    }
})
