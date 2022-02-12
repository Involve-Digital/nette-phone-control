(function (global, factory) {
  if (!global.Nette) {
    return;
  }

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return factory(global);
    });
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global);
  } else {
    var init = !global.Nette || !global.Nette.noInit;
    global.Nette.PhoneControl = factory(global);
    if (init) {
      global.Nette.PhoneControl.initOnLoad();
    }
  }

}(typeof window !== 'undefined' ? window : this, function (window) {

  'use strict';

  var PhoneControl = {};

  PhoneControl.version = '1.0';
  PhoneControl.options = {
    'flag': true,
    'otherText': '-jiné-',
    'singleOptionPaddingOffset': 15,
    'multiOptionsPaddingOffset': 20,
    'dropdownChevronTopOffset': 8
  };

  PhoneControl.initOnLoad = function () {
    Nette.onDocumentReady(function () {
      var controls = document.querySelectorAll('.phone-control:not([data-initialized])');

      for (var i = 0; i < controls.length; i++) {
        PhoneControl.initControl(controls[i]);
      }

      document.onclick = function (e) {
        if (e.target.classList.contains('phone-control-selected')) {
          return;
        }

        var regionCodeLists = document.querySelectorAll('.phone-control-region-code');

        for (var i = 0; i < regionCodeLists.length; i++) {
          regionCodeLists[i].classList.remove('phone-control-active');
        }
      }

      document.onkeyup = function (e) {
        if (e.code !== 'Escape') {
          return;
        }

        var regionCodeLists = document.querySelectorAll('.phone-control-region-code');

        for (var i = 0; i < regionCodeLists.length; i++) {
          regionCodeLists[i].classList.remove('phone-control-active');
        }
      }

      Nette.validators['InvolveFormsControlsPhoneControl_validateNumber'] = (elem) => {
        return PhoneControl.validateControl(elem);
      };
    });
  };

  PhoneControl.initControl = function (control) {
    var phoneControl = control;
    var regionCodeControl = PhoneControl.getRegionCodeControlByPhoneControl(phoneControl);

    if (!phoneControl.hasAttribute('data-region-codes')) {
      return;
    }

    var codes = JSON.parse(phoneControl.getAttribute('data-region-codes'));

    var countryCodes = Object.keys(codes);
    var regionCodes = Object.values(codes);

    var strict = parseInt(phoneControl.getAttribute('data-strict'));
    var singleOption = PhoneControl.hasSingleOption(phoneControl);

    var regionCodesList = document.createElement('ul');
    var regionCodeContent = '';

    var svg = '<svg style="display:inline;position:relative;width:10px;vertical-align:top;top:' + PhoneControl.options.dropdownChevronTopOffset + 'px;left:4px;" xmlns="http://www.w3.org/2000/svg"  x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">\n' + '<g><path d="M961.2,236.5c-38.4-38.4-101.2-38.4-139.6,0L500,558L178.4,236.5c-38.4-38.4-101.2-38.4-139.6,0C0.4,274.9,0.4,337.6,38.8,376l388.1,388.1c20,20,46.8,29,73.1,28.1c26.5,0.9,53.1-8.1,73.1-28.1L961.3,376C999.6,337.6,999.6,274.8,961.2,236.5z"/></g>\n' + '</svg>';

    for (var j = 0; j < regionCodes.length; j++) {
      if (j === 0) {
        regionCodeContent = '<li class="phone-control-selected">+' + regionCodes[j] + (singleOption ? '' : svg) + '</li>';
      }

      regionCodeContent = regionCodeContent + '<li>' +
        '+' + regionCodes[j] +
        (PhoneControl.options.flag ? '<img src="https://flagcdn.com/16x12/' + countryCodes[j].toLowerCase() + '.png">' : '') +
        '</li>';
    }

    if (!strict) {
      regionCodeContent = regionCodeContent + '<li class="phone-control-other">' + PhoneControl.options.otherText + '</li>';
    }

    regionCodesList.classList.add('phone-control-region-code');
    regionCodesList.innerHTML = regionCodeContent;

    var selected = regionCodesList.querySelector('.phone-control-selected');

    selected.onclick = function (e) {
      e.stopPropagation();

      if (document.activeElement.tagName === 'INPUT') {
        regionCodesList.classList.remove('phone-control-active');
        return;
      }

      if (singleOption) {
        return;
      }

      var regionCodesLists = document.querySelectorAll('.phone-control-region-code');

      var zIndex = 999;
      for (var i = 0; i < regionCodesLists.length; i++) {
        regionCodesLists[i].style.zIndex = zIndex--;

        if (regionCodesLists[i] === regionCodesList) {
          continue;
        }

        regionCodesLists[i].classList.remove('phone-control-active');
      }

      regionCodesList.classList.toggle('phone-control-active');
    };

    var options = regionCodesList.querySelectorAll('li:not([class])');

    for (var k = 0; k < options.length; k++) {
      var option = options[k];

      option.onclick = function () {
        selected.innerHTML = this.innerText + (singleOption ? '' : svg);
        regionCodesList.classList.remove('phone-control-active');

        PhoneControl.setRegionCodeControlValue(undefined, regionCodeControl, selected);
        PhoneControl.adjustPhoneControlPadding(phoneControl, regionCodesList);

        phoneControl.focus();
      };
    }

    if (!strict) {
      var other = regionCodesList.querySelector('.phone-control-other');

      other.onclick = function () {
        selected.innerHTML = '+<input type="tel">' + (singleOption ? '' : svg);
        regionCodesList.classList.remove('phone-control-active');

        var input = selected.querySelector('input');

        input.onkeyup = function () {
          this.value = this.value.replace(/[^0-9-]/g, '');

          PhoneControl.setRegionCodeControlValue(undefined, regionCodeControl, selected);
        };

        input.focus();

        PhoneControl.adjustPhoneControlPadding(phoneControl, regionCodesList);
      };
    }

    phoneControl.oninput = phoneControl.onchange = phoneControl.onpaste = phoneControl.onkeyup = function (e) {
      if (this.value.includes('+')) {
        regionCodesList.classList.add('phone-control-disabled');
        PhoneControl.setRegionCodeControlValue(null, regionCodeControl, selected);
      } else {
        regionCodesList.classList.remove('phone-control-disabled');
        PhoneControl.setRegionCodeControlValue(undefined, regionCodeControl, selected);
      }

      PhoneControl.adjustPhoneControlPadding(phoneControl, regionCodesList);
      PhoneControl.validateControl(phoneControl);

      e.stopPropagation();
    };

    phoneControl.parentNode.insertBefore(regionCodesList, phoneControl);

    phoneControl.dataset.initialized = 1;

    if (phoneControl.value.includes('+')) {
      PhoneControl.setRegionCodeControlValue(null, regionCodeControl, selected);
      regionCodesList.classList.add('phone-control-disabled');
    } else if (regionCodeControl.value) {
      var value = regionCodeControl.value;

      PhoneControl.setRegionCodeControlValue(value, regionCodeControl, selected);

      if (regionCodes.includes(value.replace('+', ''))) {
        selected.innerHTML = value + (singleOption ? '' : svg);
      } else {
        selected.innerHTML = '+<input type="tel" value="' + value.replace('+', '') + '">' + (singleOption ? '' : svg);
      }
    } else {
      PhoneControl.setRegionCodeControlValue(undefined, regionCodeControl, selected);
    }

    PhoneControl.adjustPhoneControlPadding(phoneControl, regionCodesList);
    PhoneControl.validateControl(phoneControl);
  };

  PhoneControl.validateControl = function (phoneControl) {
    if (typeof libphonenumber === 'undefined') {
      console.warn(
        'PhoneControl: for JS validation include "libphonenumber-js" library,' +
        'or overwrite "Nette.PhoneControl.validateControl" with your own validation.'
        );
      return true;
    }

    var regionCodeControl = PhoneControl.getRegionCodeControlByPhoneControl(phoneControl);

    try {
      var phoneNumber = new libphonenumber.parsePhoneNumber(regionCodeControl.value + phoneControl.value);

      if (!regionCodeControl.value && phoneControl.getAttribute('data-strict')) {
        var regionCodes = JSON.parse(phoneControl.getAttribute('data-region-codes'));
        regionCodes = Object.values(regionCodes);

        isValid = false;
        for (var i = 0; i < regionCodes.length; i++) {
          if (phoneControl.value.startsWith('+' + regionCodes[i])) {
            isValid = phoneNumber.isValid();
          }
        }
      } else {
        var isValid = phoneNumber.isValid();
      }
    } catch (error) {
      isValid = false;
    }

    return isValid;
  };

  PhoneControl.hasSingleOption = function (phoneControl) {
    var codes = JSON.parse(phoneControl.getAttribute('data-region-codes'));
    var regionCodes = Object.values(codes);

    var strict = parseInt(phoneControl.getAttribute('data-strict'));

    return regionCodes.length === 1 && strict === 1;
  };

  PhoneControl.adjustPhoneControlPadding = function (phoneControl, regionCodesList) {
    var singleOption = PhoneControl.hasSingleOption(phoneControl);

    if (regionCodesList.classList.contains('phone-control-disabled')) {
      phoneControl.style.paddingLeft = null;
      return;
    }

    phoneControl.style.paddingLeft = (regionCodesList.offsetWidth + (singleOption ? PhoneControl.options.singleOptionPaddingOffset : PhoneControl.options.multiOptionsPaddingOffset)) + 'px';
  };

  PhoneControl.setRegionCodeControlValue = function (value, regionCodeControl, selected) {
    if (typeof value !== 'undefined') {
      regionCodeControl.value = value;
      return;
    }

    if (selected.innerHTML.includes('input')) {
      regionCodeControl.value = '+' + selected.querySelector('input').value;
      return;
    }

    regionCodeControl.value = selected.innerText;
  };

  PhoneControl.getRegionCodeControlByPhoneControl = function (phoneControl) {
    var phoneControlName = phoneControl.getAttribute('name');

    if (phoneControlName.includes(']')) {
      phoneControlName = phoneControlName.substring(phoneControlName.length - 1);
    }

    return phoneControl.closest('form').querySelector(
      '[name*="' + phoneControlName + '"][name*="RegionCode"]'
    );
  };

  return PhoneControl;
}));
