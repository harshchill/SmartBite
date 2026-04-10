const table = document.getElementById("ordersTable");

function renderOrders(orders){
while(table.rows.length > 1){
table.deleteRow(1);
}

orders.forEach((order) => {
    let row = table.insertRow();

    row.insertCell(0).innerText = order.name;
    row.insertCell(1).innerText = order.mobile;
    row.insertCell(2).innerText = order.items.map((item) => item.name).join(", ");
    row.insertCell(3).innerText = order.status;

    let actionCell = row.insertCell(4);

    let statusBtn = document.createElement("button");
    statusBtn.innerText = "Mark Delivered";

    statusBtn.onclick = async function(){
        await fetch(`/api/orders/${order.id}/status`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ status: "Delivered" })
        });
        loadOrders();
    };

    let deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Delete";

    deleteBtn.onclick = async function(){
        await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
        loadOrders();
    };

    actionCell.appendChild(statusBtn);
    actionCell.appendChild(deleteBtn);
});
}

async function loadOrders(){
const response = await fetch("/api/orders");
const orders = await response.json();

if(!response.ok){
    alert("Unable to load orders");
    return;
}

renderOrders(orders);
}

loadOrders();
