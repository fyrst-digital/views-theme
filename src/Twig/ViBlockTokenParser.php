<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Twig\Node\Node;
use Twig\Token;
use Twig\TokenParser\AbstractTokenParser;

final class ViBlockTokenParser extends AbstractTokenParser
{
    public function parse(Token $token): Node
    {
        $lineno = $token->getLine();
        $stream = $this->parser->getStream();
        $name = $stream->expect(Token::NAME_TYPE)->getValue();
        $stream->expect(Token::BLOCK_END_TYPE);
        $body = $this->parser->subparse([$this, 'decideViBlockEnd'], true);
        $stream->expect(Token::BLOCK_END_TYPE);

        return new ViBlockNode($name, $body, $lineno);
    }

    public function decideViBlockEnd(Token $token): bool
    {
        return $token->test('endvi_block');
    }

    public function getTag(): string
    {
        return 'vi_block';
    }
}
