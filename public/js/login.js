let loginBtn = document.getElementById("login");
let logoutBtn = document.getElementById("logout");

loginBtn.addEventListener("click", () => {
  let oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  let form = document.createElement("form");
  form.setAttribute("method", "GET");
  form.setAttribute("action", oauth2Endpoint);

  let params = {
    client_id:
      "514279368463-lgl72960c3e5kbs6uqrkcm7ufsisi2j7.apps.googleusercontent.com",
    redirect_uri: "http://localhost:5006",
    response_type: "token",
    scope:
      "https://www.googleapis.com/auth/userinfo.profile",
    include_granted_scope: "true",
    state: "pass-through-value",
  };

  for (var p in params) {
    let input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", p);
    input.setAttribute("value", params[p]);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
});

let params = {};
let regex = /([^&=]+)=([^&]*)/g,
  temp;

while ((temp = regex.exec(location.href))) {
  params[decodeURIComponent(temp[1])] = decodeURIComponent(temp[2]);
}

if (Object.keys(params).length > 0) {
  localStorage.setItem("authInfo", JSON.stringify(params));
}

// hiding access token -
window.history.pushState({}, document.title, "/" + "index.html");

let info = JSON.parse(localStorage.getItem("authInfo"));

if (info !== null) {
  fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${info["access_token"]}`,
    },
  })
    .then((data) => data.json())
    .then((info) => {
      console.log(info);
      document.getElementById("name").innerHTML += info.name;
      document.getElementById("name").classList.add("nameCSS");
      document.getElementById("image").setAttribute("src", info.picture);
      document.getElementById('login').textContent='Logout';
  });
}

function logout() {
  fetch("https://oauth2.googleapis.com/revoke?token=" + info["access_token"], {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
  }).then(() => {
    // Remove stored authentication information
    localStorage.removeItem("authInfo");
    // Redirect to the login page
    location.href = "http://localhost:5006";
  });
}

// Hide login button if logged in
if (info && info.hasOwnProperty("access_token")) {
  loginBtn.style.display = "none";
}
if (info && info.hasOwnProperty("access_token")) {
  logoutBtn.style.display = "block";
}


function ProfileClicked() {
  if (info && info.hasOwnProperty("access_token")) {
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${info["access_token"]}`,
      },
    })
      .then((data) => data.json())
      // .then((userInfo) => {
      //   console.log(userInfo);
      //   document.getElementById("name").innerHTML += userInfo.name;

      //   // Display the profile photo
      //   let profileImage = document.getElementById("image");
      //   profileImage.src = userInfo.picture;
      //   profileImage.alt = "Profile Picture";

      //   document.getElementById("name").classList.add("nameCSS");
      //   document.getElementById('login').textContent='Logout';
      // });
  }
}


