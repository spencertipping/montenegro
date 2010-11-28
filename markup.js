// Markup syntax:
let[person(x) = html[ div('First name:', input.first/val(x.first)),
                      div('Last name:',  input.last/val(x.last)),
                      div.buttons(button%save > 'Save', button%cancel > 'Cancel') ]] in

$('body').append(html[ h1('The App'), div.app >= xs.map(person) ]);
