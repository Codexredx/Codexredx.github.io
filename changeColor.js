function changeColor()
{
    const lines = document.getElementById('line');

    lines.forEach(function(lines) 
    {
        if (lines.classList.contains('line'))
        {
            lines.style.backgroundcolor = 'black';
            lines.style.color = 'white';
        }
    });
}