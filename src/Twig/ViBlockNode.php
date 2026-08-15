<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Symfony\UX\TwigComponent\BlockStack;
use Twig\Attribute\YieldReady;
use Twig\Compiler;
use Twig\Node\Node;
use Twig\Node\NodeOutputInterface;

#[YieldReady]
final class ViBlockNode extends Node implements NodeOutputInterface
{
    public function __construct(string $name, Node $body, int $lineno)
    {
        parent::__construct(['body' => $body], ['name' => $name], $lineno);
    }

    public function compile(Compiler $compiler): void
    {
        $name = $this->getAttribute('name');
        $blockStack = BlockStack::class;
        $fallback = BlockStack::OUTER_BLOCK_FALLBACK_NAME;

        $compiler
            ->addDebugInfo($this)
            ->write(\sprintf(
                'if (isset($context[\'outerBlocks\']) && $context[\'outerBlocks\'] instanceof \%s && ($__viBlock = $context[\'outerBlocks\']->%s()) !== %s) {' . "\n",
                $blockStack,
                $name,
                var_export($fallback, true),
            ))
            ->indent()
            ->write('yield from $this->unwrap()->yieldBlock($__viBlock, $context, $blocks);' . "\n")
            ->outdent()
            ->write("} else {\n")
            ->indent()
            ->subcompile($this->getNode('body'))
            ->outdent()
            ->write("}\n")
        ;
    }
}
