js.settings.debug = true;

(function()  {
    var fixture = {
        
    };
    
    var helper = {
        // maximum of 52 unique ([a-z, A-Z])
        // TODO: implement aa, bb, cc, ...
        getCharacterAt : function( index )  {
            var length = 26;
            var multiple =      Math.floor(index / length);
            var lowerOrUpper =  (multiple % 2 === 0 ? 122 : 90);
            index =             (index - (length * multiple));
            
            return( String.fromCharCode( (lowerOrUpper - length) + (index + 1) ) );
        },
        
        generateSimpleObject : function( numberOfProperties, startIndex )  {
            var dict = {};
            startIndex = (startIndex || 0);
            
            for( var i = startIndex; i < (numberOfProperties + startIndex); i++ )  {
                var character = this.getCharacterAt( i );
                dict[ character ] = character;
            }
            
            return( dict );
        },
        
        generateSimpleList : function( numberOfElements, startIndex )  {
            var list = [];
            startIndex = (startIndex || 0);
            
            for( var i = startIndex; i < (numberOfElements + startIndex); i++ )  {
                var character = this.getCharacterAt( i );
                list.push( character );
            }
            
            return( list );
        },
        
        objectContainsAll : function( obj, maps )  {
            var property;
            var map;
            
            for( var i = 0; i < maps.length; i++ )  {
                map = maps[i];
                
                for( property in map )  {
                    if( !map.hasOwnProperty(property) )  { continue; }
                    if( obj[property] !== map[property] )  {
                        return( false );
                    }
                }
            }
            
            return( true );
        }
        
    };
    
    
    TestRunner.push('js.lang.Class: helpers', {
        setup : function() {},
        teardown : function() {},
        
        testSanity : function() {
            assertTrue(true, 'Ensure setup and tear down are not failing.');
        },
        
        testMerge : function()  {
            // test that merge takes an object to merge a list of objects into
            var a = helper.generateSimpleObject(1);
            var mergers = [
                helper.generateSimpleObject(1, 1),
                helper.generateSimpleObject(1, 2)
            ];
            
            js.lang.Class.__merge__( a, mergers );
            
            assertEquals( a.b, mergers[0].b, 'Ensure property (b) was copied.' );
            assertEquals( a.c, mergers[1].c, 'Ensure property (c) was copied.' );
        },
        
        testMergeLastOverriddenByFirst : function()  {
            var a = helper.generateSimpleObject(1);
            var mergers = [
                { 'b' : 'a' },
                helper.generateSimpleObject(1, 1),
                helper.generateSimpleObject(1, 1),
                helper.generateSimpleObject(1, 1),
                helper.generateSimpleObject(1, 1)
            ];
            
            js.lang.Class.__merge__( a, mergers );
            
            assertEquals( a.b, mergers[0].b, 'Ensure property (b) was copied and overrode prevous b.' );
        },
        
        testArrayContainsAllHappyPath : function()  {
            var a = helper.generateSimpleList(6);
            var b = helper.generateSimpleList(4, 1);
            
            var containsAll = js.lang.Class.__arrayContainsAll__( a, b );
            
            assertTrue( containsAll, 'Ensure that a list of 6 contains all elements of a list of 4.' );
        },
        
        testArrayContainsAllEdgeCases : function()  {
            var a = helper.generateSimpleList(6);
            var b = helper.generateSimpleList(4, 0);
            var c = helper.generateSimpleList(4, 2);
            
            var containsAllFirst = js.lang.Class.__arrayContainsAll__( a, b );
            var containsAllLast = js.lang.Class.__arrayContainsAll__( a, c );
            
            assertTrue( containsAllFirst, 'Ensure that a list of 6 contains all elements of a list of 4 (first 4).' );
            assertTrue( containsAllLast, 'Ensure that a list of 6 contains all elements of a list of 4 (last 4).' );
        },
        
        testArrayContainsAllOneElement : function()  {
            var a = helper.generateSimpleList(1);
            var b = helper.generateSimpleList(1);
            
            var containsAll = js.lang.Class.__arrayContainsAll__( a, b );
            
            assertTrue( containsAll, 'Ensure that a list of 1 contains all elements of a list of 1.' );
        },
        
        testArrayContainsAllFails : function()  {
            var a = helper.generateSimpleList(1);
            var b = helper.generateSimpleList(1, 1);
            
            var containsAll = js.lang.Class.__arrayContainsAll__( a, b );
            
            assertFalse( containsAll, 'Ensure that contains-all will fail if lists differ.' );
        },
        
        testInitStaticInvocationThrowsTypeError : function()  {
            try  {
                js.lang.Class.__init__();
            }
            catch(e)  {
                assertTrue((e instanceof TypeError), 'Ensure calling __init__ statically throws TypeError');
            }
        },
        
        testInitInstanceInvocationCalls__init__WithAllArgs : function()  {
            var argsLength = null;
            var A = function(){};
            A.prototype.__init__ = function()  { argsLength = arguments.length; }
                
            var args = helper.generateSimpleList(9);
            
            js.lang.Class.__init__.call( {}, A, args );
            
            assertEquals( args.length, argsLength, 'Ensure calling __init__ on an object instance calls their __init__, passing all args.' );
        },
        
        testInitInstanceInvocationWithout__init__DoesntFail : function()  {
            js.lang.Class.__init__.call( {}, function(){} );
            
            assertTrue( true, 'Ensure calling __init__ on an object instance without __init__ doesnt fail.' );
        },
        
        testInvokeInvokesExistingFunction : function()  {
            var called = false;
            var caller = function()  { called = true; };
            
            js.lang.Class.__invoke__( null, caller );
            
            assertTrue( called, 'Ensure caller got invoked.' );
        },
        
        testInvokeInvokesExistingFunctionAndForwardsArgs : function()  {
            var argsLength = null;
            var args = helper.generateSimpleList(9);
            var caller = function()  { argsLength = arguments.length; }
            
            js.lang.Class.__invoke__( null, caller, args );
            
            assertEquals( args.length, argsLength, 'Ensure caller got invoked with args.' );
        },
        
        testInvokeDoesntFailIfFalsyValuePassed : function()  {
            js.lang.Class.__invoke__();
            assertTrue( true, 'Ensure invoke doesnt fail if falsy value passed.' );
        },
        
        testConstructorCatchesInvocationWithGlobalContext : function()  {
            var called = false;
            var globalCB = function()  { called = true; };
            var A = function(){};
            
            js.lang.Class.__constructor__.call( js.lang.GlobalContext, A, globalCB );
            
            assertTrue( called, 'Ensure global-callback got executed.' );
        },
        
        testConstructorAssignsConstructorProperty : function()  {
            var a = {};
            var A = function(){};
            A.__initialized__ = true;
            
            js.lang.Class.__constructor__.call( a, A );
            
            assertEquals( A, a.constructor, 'Ensure the constructor property gets set within the constructor method.' );
            
        },
        
        testGeneratedClassReturnsValueFromGlobalContext : function()  {
            
        },
        
        testGeneratecClassBindsStaticInitToClass : function()  {
            var A = js.lang.Class.__generateClass__();
            
            var containsInit = ( ('__init__' in A) && (A.__init__ instanceof Function) );
            assertTrue( containsInit, 'Ensure __init__ gets statically bound to the generated class.' );
        },
        
        testGeneratecClassesStaticInitIsCallableAndFailsSilently : function()  {
            var A = js.lang.Class.__generateClass__();
            
            A.__init__.call({});
            
            assertTrue( true, 'Ensure static init property is callable and does not fail if prototype init doesnt exist.' );
        },
        
        testExtendBasic : function()  {
            var A = function(){};
            var B = function(){};
            
            js.lang.Class.__extend__( B, [ A ] );
            
            var b = new B();
            
            assertTrue( b instanceof B, 'Ensure prototype did not get munged. (b instanceof B)' );
            assertTrue( b instanceof A, 'Ensure prototype got applied.' );
        },
        
        testExtendAssignsStaticInitWhichInvokesPrototypeInit : function()  {
            var invoked = false;
            
            var A = new js.lang.Class()  ({
                __init__ : function()  {
                    invoked = true;
                }
            });
            
            A.__init__.call({});
            
            assertTrue( invoked, 'Ensure the prototypes init is hooked up to the static init.' );
        },
        
        testExtendWithMultipleParentsAppliesAllMethodsToPrototype : function()  {
            var A = function(){};
            A.prototype.a = function(){};
            var B = function(){};
            B.prototype.b = function(){};
            var C = function(){};
            C.prototype.c = function(){};
            
            var D = function(){};
            
            js.lang.Class.__extend__( D, [ A, B, C ] );
            
            var containsAll = helper.objectContainsAll( D.prototype, [ A.prototype, B.prototype, C.prototype ] );
            assertTrue( containsAll, 'Ensure D.prototype now contains all properties in [A,B,C].prototype.' );
        },
        
        testExtendInvokesMerge : function()  {
            
        },
        
        testExtendInvokesBindStubs : function(){
            
        }
    });
    
    
    TestRunner.push('js.lang.Class', {
        setup : function() {},
        teardown : function() {},
        
        testSanity : function() {
            assertTrue(true, 'Ensure setup and tear down are not failing.');
        },
        
        testBasics : function()  {
            var A = new js.lang.Class();
            
            assertEquals( A.constructor, Function, 'Ensure instantiating a class returns a function.' );
            assertTrue( A.prototype !== undefined, 'Ensure prototype exists.' );
            assertEquals( A.prototype.constructor, Object, 'Ensure prototypes constructor has been set.' );
        },
        
        testInstanceOf : function()  {
            var A = new js.lang.Class()  ({});
            var a = new A();
            
            assertTrue( (a instanceof A), 'Ensure prototype chain is being linked.' );
            assertEquals( A, a.constructor, 'Ensure constructor property is being set.' );
        },
        
        testInitInvoked : function()  {
            var invoked = false;
            var A = new js.lang.Class()  ({ __init__ : function()  { invoked = true; } });
            
            assertFalse( invoked, 'Ensure init doesnt get invoked prior to instantiation.' );
            var a = new A();
            assertTrue( invoked, 'Ensure init gets invoked upon instantiation.' );
        }
    });
    
    TestRunner.push('js.lang.Class: inheritance', {
        setup : function() {},
        teardown : function() {},
        
        testSanity : function() {
            assertTrue(true, 'Ensure setup and tear down are not failing.');
        },
        
        testInheritanceBasics : function()  {
            var A = new js.lang.Class()  ({});
            var B = new js.lang.Class( A )  ({});
            
            var b = new B();
            
            assertTrue( (b instanceof B), 'Ensure inheriting maintains immediate parent link.' );
            assertEquals( B, b.constructor, 'Ensure inheriting maintains immediate parent link.' );
            
            assertTrue( (b instanceof A), 'Ensure inheriting hooks up grand-parent link.' );
        },
        
        testInheritanceWithProperties : function()  {
            var aProperties = helper.generateSimpleObject(1);
            var bProperties = helper.generateSimpleObject(1, 1);
            
            var A = new js.lang.Class()  (aProperties);
            var B = new js.lang.Class( A )  (bProperties);
            
            assertTrue( helper.objectContainsAll( B.prototype, [ aProperties, bProperties ] ) );
        }
    });
    
    
    TestRunner.push('js.lang.Interface: helpers', {
        setup : function() {},
        teardown : function() {},
        
        testSanity : function() {
            assertTrue(true, 'Ensure setup and tear down are not failing.');
        },
        
        testGenerateStub : function()  {
            var stub = js.lang.Interface.__generateStub__( 'name', ['param1', 'param2']);
            
            try  {
                stub();
            }
            catch(e)  {
                assertTrue( (e instanceof ReferenceError), 'Ensure the stub throws a reference-error.' );
                assertEquals( stub.__message__, e.message, 'Ensure the error is the reference-error were looking for.' );
            }
        },
        
        testGenerateStubMessage : function()  {
            var name = 'name';
            var param = 'param1';
            
            var msg = js.lang.Interface.__generateStubMessage__( 'name', ['param1'] );
            
            assertTrue( (msg.indexOf('name') > -1), 'Ensure the name of the method is being inserted appropriately into the message.' );
            assertTrue( (msg.indexOf(param) > -1), 'Ensure the parameter of the method is being insterted appropriately into the message.' );
            
        },
        
        testGenerateStubs : function()  {
            var stubs = {
                a : ['a'],
                b : ['b'],
                c : ['c']
            };
            
            js.lang.Interface.__generateStubs__( stubs );
            
            assertTrue( (stubs.a instanceof Function), 'Ensure a was converted to a stub.' );
            assertTrue( (stubs.b instanceof Function), 'Ensure b was converted to a stub.' );
            assertTrue( (stubs.c instanceof Function), 'Ensure c was converted to a stub.' );
        },
        
        testBindStubsDoesAnythingAtAll : function()  {
            var a = 'a';
            var A = function(){};
            A.prototype.a = a;
            
            var interfaces = [
                new js.lang.Interface()  ({
                    a : ['a', 'b'],
                    d : ['a', 'b']
                }),
                new js.lang.Interface()  ({
                    b : ['a', 'b'],
                    c : ['a', 'b']
                })
            ];
            
            js.lang.Interface.__bindStubs__( A, interfaces );
            
            assertEquals( a, A.prototype.a, 'Ensure existing methods, etc. are not overriden by stubs.' );
            assertTrue( (A.prototype.d instanceof Function), 'Ensure multiple properties get copied.' );
            
            assertTrue( (A.prototype.b instanceof Function), 'Ensure multiple interfaces get copied.' );
            assertTrue( (A.prototype.c instanceof Function), 'Ensure multiple interfaces get copied.' );
        },
        
        testInterface : function()  {
            var ifaceClass = new js.lang.Interface();
            var iface = ifaceClass  ({
                    a : ['a', 'b'],
                    d : ['a', 'b']
                });
                
            assertEquals( Function, ifaceClass.constructor, 'Ensure interface generates a class.' );
            assertEquals( ifaceClass, iface.constructor, 'Ensure interface invocation returns the instance of the generates class.' );
            assertTrue( (iface instanceof ifaceClass), 'Ensure interface invocation returns the instance of the generates class.' );
        }
    });
    
    TestRunner.push('Function.prototype.Implements', {
        setup : function() {},
        teardown : function() {},
        
        testSanity : function() {
            assertTrue(true, 'Ensure setup and tear down are not failing.');
        },
        
        
        testImplementsWithInheritence : function()  {
            var iA = new js.lang.Interface()  ({
                a : ['a', 'b']
            });
            
            var iB = new js.lang.Interface()  ({
                b : ['a', 'b']
            });
            
            var A = new js.lang.Class() . Implements( iA )  ({});
            var B = new js.lang.Class( A ) . Implements( iB )  ({});
            
            var b = new B();
            
            try  {
                b.a();
            }
            catch(e)  {
                assertTrue( (e instanceof ReferenceError), 'Ensure the stub throws a reference-error.' );
                assertEquals( b.a.__message__, e.message, 'Ensure the error is the reference-error were looking for.' );
            }
            
            try  {
                b.b();
            }
            catch(e)  {
                assertTrue( (e instanceof ReferenceError), 'Ensure the stub throws a reference-error.' );
                assertEquals( b.b.__message__, e.message, 'Ensure the error is the reference-error were looking for.' );
            }
        }
    });
    
    
    TestRunner.push('Function.prototype.enforces', {
        setup : function() {},
        teardown : function() {},
        
        testSanity : function() {
            assertTrue(true, 'Ensure setup and tear down are not failing.');
        },
        
        testEnforcesBasics : function()  {
            var iA = new js.lang.Interface()  ({
                a : ['a', 'b']
            });
            
            var iB = new js.lang.Interface()  ({
                b : ['a', 'b']
            });
            
            var A = new js.lang.Class() . Implements( iA )  ({});
            
            assertTrue( A.enforces( iA ), 'Ensure enforces returns true.' );
            assertFalse( A.enforces( iB ), 'Ensure enforces returns false.' );
        },
        
        testEnforcesWithInheritence : function()  {
            var iA = new js.lang.Interface()  ({
                a : ['a', 'b']
            });
            
            var iB = new js.lang.Interface()  ({
                b : ['a', 'b']
            });
            
            var A = new js.lang.Class() . Implements( iA )  ({});
            var B = new js.lang.Class( A ) . Implements( iB )  ({});
            
            assertTrue( B.enforces(iA), 'Ensure that child classes enforce parent interfaces.' );
        }
    });
})();
