/* ===== account helpers shared by every simulator: a sign-out button on the home page while signed in ===== */
{const h=$('hAcctBtn');if(h&&!$('hOut')){const b=document.createElement('button');b.className='chip';b.id='hOut';b.textContent='↩ Sign out';b.title='Sign out (back to guest)';b.onclick=()=>switchAcc('guest');h.after(b)}
  setInterval(()=>{const b=$('hOut');if(b)b.hidden=!curAcc()},500)}
