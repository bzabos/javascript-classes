# JavascriptClasses v1.0 has been released! 

This framework provides the ability to elegantly write javascript classes, with full capabilities of deep hierarchies, including interfaces, and multiple inheritance with familiar syntax.

(This project is still in it's early stages, please let me know what your first reaction to this code is. Suggestions and tips are welcome!)

```javascript
Animal = new Class()  ({
    __init__ : function( firstName, lastName )  {
        this.firstName = firstName;
        this.lastName = lastName;
    },
    
    getFullName : function()  {
        return( this.firstName + ' ' + this.lastName );
    }
});

Human = new Class( Animal )  ({
    __init__ : function( firstName, lastName, tshirtColor )  {
        Animal.__init__.call(this, firstName, lastName);
        this.tshirtColor = tshirtColor;
    }
});

var a = new Animal('Fluffy', 'Smith');
var h = new Human('Bartholomew', 'Zabos', 'green');
```
