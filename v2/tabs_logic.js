const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach((tab, idx) => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    contents.forEach(tc => tc.style.display = 'none');
    if(idx==3)
        contents[idx].style.display = 'block'; // or 'block' depending on layout
    else
        contents[idx].style.display = 'flex'; // or 'block' depending on layout

    
    
  });
});




