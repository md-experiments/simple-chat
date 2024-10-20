from openai import OpenAI
import anthropic
import os
import json
import tiktoken

def num_tokens_from_string(string: str, model_name = 'gpt-3.5-turbo') -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(model_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def llm_call(model_name: str, system_prompt: str, message_list: list[str,str]):
    assert model_name in ['gpt-4o', 'gpt-4o-mini', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620'], f"Unknown model name: {model_name}"
    if model_name.startswith('gpt'):
        return call_gpt(model_name, system_prompt, message_list)
    elif model_name.startswith('claude'):
        return call_claude(model_name, system_prompt, message_list)
    else:
        raise ValueError(f"Unknown model name: {model_name}")


def call_gpt(model_name: str, system_prompt: str, message_list: list[str,str]):
    chat_history = [{'role': 'assistant', 'content': str(msg)} if tp == 'ai' 
            else {'role': 'user', 'content': msg} for tp,msg in message_list]
    system_message = [{'role': 'system', 'content': system_prompt}]
    messages = system_message + \
            chat_history
    tokens = num_tokens_from_string(json.dumps(messages))
    print('Tokens:', tokens)
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model = model_name,
        messages = messages,
        temperature = 0.0,
    )
    nr_tokens = {
        'completion_tokens': response.usage.completion_tokens,
        'total_tokens': response.usage.total_tokens,
        'prompt_tokens': response.usage.prompt_tokens
    }
    return response.choices[0].message.content, response, nr_tokens


def call_claude(model_name: str, system_prompt: str, message_list: list[str,str]):
    client = anthropic.Anthropic(
        # defaults to os.environ.get("ANTHROPIC_API_KEY")
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
    chat_history = [{'role': 'assistant', 'content': str(msg)} if tp == 'ai' 
            else {'role': 'user', 'content': msg} for tp,msg in message_list]
    message = client.messages.create(
        model=model_name,
        temperature=0.0,
        system=system_prompt,
        messages=chat_history
    )
    nr_tokens = {
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
        "total_tokens": message.usage.input_tokens + message.usage.output_tokens
        }
    return message.content[0].text, message, nr_tokens