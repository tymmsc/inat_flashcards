document.querySelectorAll('input[name="topFormChoice"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelector('.form-top-inner.option1').style.display =
      radio.value === "option1" ? "block" : "none";
    document.querySelector('.form-top-inner.option2').style.display =
      radio.value === "option2" ? "block" : "none";
  });
});
