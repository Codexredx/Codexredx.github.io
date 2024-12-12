function changeColor()
{
    var lines = document.querySelectorAll('div');

    lines.forEach(function(div) 
    {
        if (div.classList.contains('line'))
        {
            div.style.backgroundColor = 'red';
            div.style.color = 'black';
        }
    });
}