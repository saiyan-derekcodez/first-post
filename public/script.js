function updateItemToDelete (productId) {
  document.getElementById('deleteId').value = productId;
}

async function deleteItem() {
  const productId = document.getElementById('deleteId').value;

  const resp = await fetch(`${location.origin}/product/${productId}`, {
    method: "DELETE"
  });

  const data = await resp.json();

  if (resp.status === 200) {
    location.reload();
  } else {
    alert(data.message);
  }
}

async function addProduct() {
  const name = document.querySelector("input[name='name']").value;
  const price = document.querySelector("input[name='price']").value;
  const quantity = document.querySelector("input[name='quantity']").value;
  const img = document.querySelector("input[name='img']").value;

  const resp = await fetch(`${location.origin}/product`, {
    method: 'post',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ 
      name,
      price: Number(price),
      quantity: Number(quantity),
      img
    })
  })

  const data = await resp.json()
  if (resp.status == 200) {
    location.reload()
  } else {
    alert(data.message);
  }
}

async function updateItemToUpdate(productId) {
  // fetch the product information so I can show it in the form for update
  const resp = await fetch(`${location.origin}/product/${productId}`);

  const data = await resp.json();

  if (resp.status !== 200) {
    alert(data.message);
    return;
  }

  // IF IT GETS HERE THE INFORMATION WAS FOUND
  // SO UPDATE THE PRODUCT UPDATE FIELDS
  document.querySelector("input[name='updatedName']").value = data.product.name;
  document.querySelector("input[name='updatedImg']").value = data.product.img;
  document.querySelector("input[name='updatedPrice']").value = data.product.price;
  document.querySelector("input[name='updatedQuantity']").value = data.product.quantity;

  // LASTLY UPDATE THE HIDDEN FIELD WITH THE PRODUCT ID
  document.querySelector("input[name='productId']").value = productId;
}

async function updateProduct() {
  // RETRIEVE THE UPDATED INFO
  const update = {
    name: document.querySelector("input[name='updatedName']").value,
    img: document.querySelector("input[name='updatedImg']").value,
    price: document.querySelector("input[name='updatedPrice']").value,
    quantity: document.querySelector("input[name='updatedQuantity']").value
  }

  const productId = document.querySelector("input[name='productId']").value;

  // MAKE A REQUEST
  const resp = await fetch(`${location.origin}/product/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'Application/json'
    },
    body: JSON.stringify(update)
  })

  const data = await resp.json();

  if (resp.status !== 200) {
    alert(data.message);
  } else {
    location.reload();
  }
}

async function addToCart (productId) {
  const resp = await fetch(`${location.origin}/cart`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ productId })
  })

  const data = await resp.json();

  if (resp.status === 200) {
    const cartCount = document.getElementById('cart-count');

    // increase by 1
    cartCount.textContent = parseInt(cartCount.textContent) + 1;
  } else {
    alert(data.message);
  }
}