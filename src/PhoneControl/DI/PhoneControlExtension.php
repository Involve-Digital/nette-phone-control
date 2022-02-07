<?php declare(strict_types=1);

namespace Involve\Forms\Controls\PhoneControl\DI;

use Involve\Forms\Controls\PhoneControl;
use libphonenumber\PhoneNumberFormat;
use Nette\DI\CompilerExtension;
use Nette\DI\Statement;
use Nette\PhpGenerator\ClassType;
use Nette\Utils\Validators;

class PhoneControlExtension extends CompilerExtension
{

    public $defaults = [
        'allowedRegions' => [],
        'expectedRegions' => ['CZ', 'SK'],
        'outputFormat' => PhoneNumberFormat::E164,
        'outputFormatWhitespaces' => true,
        'regex' => PhoneControl::DEFAULT_REGEX,
    ];

    public function afterCompile(ClassType $class): void
    {
        parent::afterCompile($class);

        $config = $this->getConfig() + $this->defaults;

        // backwards compatibility
        $isConstant = $config['outputFormat'] instanceof \Nette\DI\Statement && $config['outputFormat']->getEntity() === '::constant'
            || $config['outputFormat'] instanceof \Nette\DI\Definitions\Statement && $config['outputFormat']->getEntity() === 'constant';

        if ($isConstant) {
            $config['outputFormat'] = constant(reset($config['outputFormat']->arguments));
        }

        Validators::assert($config['allowedRegions'], 'null|array|string', 'Whitelisted phone number regions.');
        Validators::assert($config['expectedRegions'], 'null|array|string', 'Expected phone number from entered regions. No need to enter regions code.');
        Validators::assert($config['outputFormat'], 'int', 'Output format that input returns in getValue().');
        Validators::assert($config['outputFormatWhitespaces'], 'bool', 'Allow whitespaces in outputted number (or remove them).');
        Validators::assert($config['regex'], 'string|bool', 'Basic regex, that checks unwanted characters.');

        ksort($config);

        $initialize = $class->methods['initialize'];
        $initialize->addBody('Involve\Forms\Controls\PhoneControl::register(?, ?, ?, ?, ?);', array_values($config));
    }

}
