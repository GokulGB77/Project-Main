const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit',function(e){
  e.preventDefault();

  const formData = new FormData(this);
  fetch('/login',{
    method: 'post',
    body: formData
  }).then (function(res){
    return res.text();
  }).then(function(text){
    console.log(text);
  }).catch(function(e){
    console.log(e);
  })

})