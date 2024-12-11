function changeColor()
{
    var lines = document.querySelectorAll('div');

    lines.forEach(function(div) 
    {
        if (div.classList.contains('line'))
        {
            div.style.backgroundcolor = 'black';
            div.style.color = 'white';
        }
        else
        {
            div.style.backgroundcolor = 'white';
            div.style.color = 'black';
        }
    });
}