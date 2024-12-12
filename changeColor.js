function changeColor()
{
    const lines = document.getElementById('div');

    lines.forEach(function(div) 
    {
        if (lines.classList.contains('line'))
        {
            lines.style.backgroundcolor = 'black';
            lines.style.color = 'white';
        }
    });
}