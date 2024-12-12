function changeColor()
{
    var lines = document.querySelectorAll('div');

    lines.forEach(function(div) 
    {
        if (div.classList.contains('line'))
        {
            div.style.backgroundColor = 'white';
            div.style.color = 'black';
        }
    });
}