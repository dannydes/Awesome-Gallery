/**
* @author Daniel Desira
* @version 0.5
*/

var AG = {};

(function ( document, ArrayProto, undefined ) {

'use strict';

var TRANSITION_CLASS = 'view',
  CLICK_EVENT = 'click',
  BIGSRC_ATTR = 'bigsrc';

var delay, photos, touchStartX, image, gallery,
  
  photoIndex = 0,
  
  Switcher = (function () {
    var interval,
    Switcher = {};
    
    Switcher.next = function () {
      flipPhoto(function () {
        photoIndex = ( ++photoIndex ) % photos.length;
      });
    };
    
    Switcher.prev = function () {
      flipPhoto(function () {
        photoIndex = ( --photoIndex ) === -1 ? photos.length - 1 : photoIndex;
      });
    };
    
    Switcher.go = function ( index ) {
      var prevIndex = photoIndex;
      photoIndex = index;
      selectImage( prevIndex );
      setTimeout( changePhoto, delay );
    };
    
    Switcher.slideshow = function () {
      interval = setInterval( Switcher.next, delay * 4 );
    };
    
    Switcher.stopSlideshow = function () {console.log(123)
      clearInterval( interval );
    };
    
    function changePhoto() {
      image.classList.remove( TRANSITION_CLASS );
      setTimeout(function () {
        photos[photoIndex].getAttribute( BIGSRC_ATTR ) ?
              image.src = photos[photoIndex].getAttribute( BIGSRC_ATTR ) :
              image.src = photos[photoIndex].src;
      }, delay );
    }
    
    function flipPhoto( callback ) {
      var prevIndex = photoIndex;
      callback();
      selectImage( prevIndex );
      changePhoto();
    }
    
    return Switcher;
  })(),
  
  ag = {
    Switcher: Switcher,
    dom: {
      prev: null,
      next: null,
      slideshow: null,
      stopSlideshow: null,
      image: null,
      desc: null,
      images: null,
      gallery: null,
      galleryActivated: true
    }
  };
  
function _activateGallery() {
  document.documentElement.addEventListener( 'click', function ( event ) {
    var element = event.target,
      withinGallery = false;
    do {
      withinGallery = ( element === gallery );
      element = element.parentNode;
    } while ( !withinGallery && element !== this );
    ag.dom.galleryActivated = withinGallery;
  });
}

function handleKeyDown( event ) {
  if ( ag.dom.galleryActivated ) {
    if ( event.keyCode === 37 ) {
      Switcher.prev();
    } else if ( event.keyCode === 39 ) {
      Switcher.next();
    }
  }
}

function handleTouchStart( event ) {
  touchStartX = event.touches[0].pageX;
}

function handleTouchEnd( event ) {
  if ( event.touches[0].pageX > touchStartX ) {
    Switcher.prev();
  } else if ( event.touches[0].pageX < touchStartX ) {
    Switcher.next();
  }
  event.preventDefault();
}

function getButton( action, selector, text ) {
  var element;
  if ( selector ) {
     element = $( selector );
  } else {
     element = gallery.insertBefore( document.createElement( 'a' ), gallery.firstChild );
     element.textContent = text;
     element.classList.add( 'galleryNavButton' );
  }
  element.addEventListener( CLICK_EVENT, Switcher[action] );
  return element;
}

function $( selector ) {
  return document.querySelector( selector );
}

function selectImage( prevIndex ) {
  var SELECTION_CLASS = 'selected';
  prevIndex !== undefined && photos[prevIndex].classList.remove( SELECTION_CLASS );
  photos[photoIndex].classList.add( SELECTION_CLASS );
}

function extractFunctionArgs( args ) {
  return ArrayProto.splice.call( args, 0, args.length );
}

AG.init = function ( options ) {
  if ( options.$gallery ) {
    gallery = ag.dom.gallery = $( options.$gallery );
    _activateGallery();
    ag.dom.galleryActivated = false;
  }
  
  options.autoSlideshow && Switcher.slideshow();
  
  image = ag.dom.image = $( options.$image );
  image.addEventListener( CLICK_EVENT, Switcher.next );
  document.addEventListener( 'keydown', handleKeyDown );
  gallery.addEventListener( 'touchstart', handleTouchStart );
  gallery.addEventListener( 'touchend', handleTouchEnd );
  
  //Will appear in reverse order!
  ag.dom.slideshowEnd = getButton( 'stopSlideshow', options.$stopSlideshow, 'pause' );
  ag.dom.slideshowStart = getButton( 'slideshow', options.$slideshow, 'play' );
  ag.dom.next = getButton( 'next', options.$next, '>' );
  ag.dom.prev = getButton( 'prev', options.$prev, '<'  );
  
  image.onload = function () {
    image.classList.add( TRANSITION_CLASS );
    ag.dom.desc && ( ag.dom.desc.textContent = photos[photoIndex].alt );
  };
  
  //Work-around: WebKit and Blink do not display <img> alt text.
  image.onerror = function () {
    ag.dom.desc.textContent = (/WebKit/.test( navigator.userAgent ) ?
          ag.dom.desc.textContent : '') + ' Unable to fetch image!';
  };
  
  if ( options.images ) {
    options.images.forEach(function ( photo ) {
      var image = document.createElement( 'img' );
      image.src = photo.src;
      image.alt = photo.alt;
      photo.bigsrc && image.setAttribute( BIGSRC_ATTR, photo.bigsrc );
      ag.dom.imagesContainer.appendChild( image );
    });
    ag.dom.images = photos = ag.dom.imagesContainer.children;
  } else {
    ag.dom.images = photos = document.querySelectorAll( options.$$images );
  }
  
  Object.getOwnPropertyNames( ArrayProto ).forEach(function ( property ) {
    if ( !photos[property] ) {
      photos[property] = function () {
        return ArrayProto[property].apply( photos, extractFunctionArgs( arguments ) );
      };
    }
  });
  
  photos.forEach(function ( photo, index ) {
    photos[index].addEventListener( CLICK_EVENT, function () {
      Switcher.go( index );
    });
  });
  
  Switcher.go( 0 );
  
  options.$desc && ( ag.dom.desc = $( options.$desc ) );
  
  delay = (function () {
    var transitionDuration = getComputedStyle( image ).transitionDuration;
    return parseFloat( transitionDuration.substring( 0, transitionDuration.length - 1 ) ) * 1000;
  })();
  
  return AG;
};

AG.extend = function ( callback, methodName ) {
  methodName ? (AG[methodName] = function () {
    callback.apply( AG, [ag].concat( extractFunctionArgs( arguments ) ) );
    return AG;
  }) : callback( ag );
  
  return AG;
};

})( document, [].__proto__ );