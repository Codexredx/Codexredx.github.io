function changeColor()
{
    var lines = document.querySelectorAll('div');

    lines.forEach(function(div) 
    {
        if (div.classList.contains('line 2'))
        {
            div.style.color = 'black';
        }
    });
}