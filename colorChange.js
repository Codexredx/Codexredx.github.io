function colorChange()
{
    var lines = document.querySelectorAll('div');

    lines.forEach(function(div) 
    {
        if (div.classList.contains('line 2'))
        {
            div.style.color = 'black';
            lines.style.color = 'White';
        }
    });
}