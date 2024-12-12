function changeColor()
{
    var lines = document.querySelectorAll('div');

    lines.forEach(function(div) 
    {
        if (div.classList.contains('line'))
        {
            div.style.backgroundColor = 'black';
            div.style.color = 'white';
        }
    });
}