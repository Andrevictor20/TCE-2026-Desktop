fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: extract <pdf-path>");
        std::process::exit(1);
    }
    let path = &args[1];
    let content = pdf_extract::extract_text(path).expect("Failed to extract PDF");
    println!("{}", content);
}
